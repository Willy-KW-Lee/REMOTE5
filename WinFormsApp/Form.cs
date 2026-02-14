using Microsoft.Web.WebView2.Core;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;

namespace WinFormsApp
{
    public partial class Form : System.Windows.Forms.Form, IR5vAppProxy
    {
        const string ROOT_ADDR = "local";
        public static string ROOT_URL
        {
            get { return "http://" + ROOT_ADDR + "/"; }
        }

        R5vAppProxy? _R5vAppProxy = null;

        [DllImport("kernel32.dll")]
        static extern IntPtr LoadLibrary(string dllToLoad);
        [DllImport("kernel32.dll")]
        static extern IntPtr GetProcAddress(IntPtr hModule, string procedureName);

        IntPtr _hDllvCatchStation3 = IntPtr.Zero;
        [UnmanagedFunctionPointer(CallingConvention.StdCall)]
        delegate IntPtr FnvCatchStation3_Open();
        FnvCatchStation3_Open? _vCatchStation3_Open = null;
        [UnmanagedFunctionPointer(CallingConvention.StdCall)]
        delegate int FnvCatchStation3_Close(IntPtr hvCatchStation3);
        FnvCatchStation3_Close? _vCatchStation3_Close = null;

        IntPtr _hvCatchStation3 = IntPtr.Zero;

        public Form()
        {
            InitializeComponent();
            this.Load += Form_Load;
            this.FormClosed += Form_FormClosed;
            this.SizeChanged += Form_SizeChanged;

            this.MinimumSize = new Size(640, 400);

            webView21.CoreWebView2InitializationCompleted += WebView21_CoreWebView2InitializationCompleted;
            webView21.NavigationCompleted += WebView21_NavigationCompleted;
            webView21.WebMessageReceived += WebView21_WebMessageReceived;

            _hDllvCatchStation3 = LoadLibrary("vCatchStation3.dll");
            if (_hDllvCatchStation3 != IntPtr.Zero)
            {
                IntPtr fn = GetProcAddress(_hDllvCatchStation3, "vCatchStation3_Open");
                if (fn != IntPtr.Zero)
                    _vCatchStation3_Open = (FnvCatchStation3_Open)Marshal.GetDelegateForFunctionPointer(fn, typeof(FnvCatchStation3_Open));
                fn = GetProcAddress(_hDllvCatchStation3, "vCatchStation3_Close");
                if (fn != IntPtr.Zero)
                    _vCatchStation3_Close = (FnvCatchStation3_Close)Marshal.GetDelegateForFunctionPointer(fn, typeof(FnvCatchStation3_Close));
            }

#if DEBUG
            _R5vAppProxy = new R5vAppProxy();
            if (!_R5vAppProxy.Connect(this, 1080))
                _R5vAppProxy = null;
            else
                this.WindowState = FormWindowState.Minimized;
#endif //DEBUG
        }

        private async void Form_Load(object? sender, EventArgs e)
        {
            try
            {
                string? execFolder = null;
                string tempWebCacheDir = System.IO.Path.GetTempPath();
                tempWebCacheDir = System.IO.Path.Combine(tempWebCacheDir, System.Guid.NewGuid().ToString("N"));
                CoreWebView2Environment webView2Environment = await CoreWebView2Environment.CreateAsync(execFolder, tempWebCacheDir);
                await webView21.EnsureCoreWebView2Async(webView2Environment);
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.ToString());
                Application.Exit();
                return;
            }
            ((System.ComponentModel.ISupportInitialize)(this.webView21)).EndInit();

            CoreWebView2Settings webView2Settings = this.webView21.CoreWebView2.Settings;
            webView2Settings.IsPinchZoomEnabled = false;
            webView2Settings.IsZoomControlEnabled = false;

            UpdateLayout();

            if (_vCatchStation3_Open != null)
                _hvCatchStation3 = _vCatchStation3_Open();
        }

        void UpdateLayout()
        {
            this.webView21.Left = this.webView21.Top = 0;
            this.webView21.Width = this.ClientSize.Width;
            this.webView21.Height = this.ClientSize.Height;
        }

        private void Form_SizeChanged(object? sender, EventArgs e)
        {
            UpdateLayout();

            stateEnvironment(this, _use_state);
        }

        private void Form_FormClosed(object? sender, FormClosedEventArgs e)
        {
            if (_vCatchStation3_Close != null && _hvCatchStation3 != IntPtr.Zero)
            {
                _vCatchStation3_Close(_hvCatchStation3);
                _hvCatchStation3 = IntPtr.Zero;
            }

            if (_R5vAppProxy != null)
            {
                _R5vAppProxy.Close();
                _R5vAppProxy = null;
            }
        }

        private void WebView21_CoreWebView2InitializationCompleted(object sender, Microsoft.Web.WebView2.Core.CoreWebView2InitializationCompletedEventArgs e)
        {
            Trace.WriteLine("CoreWebView2InitializationCompleted event");
            if (webView21 == null || webView21.CoreWebView2 == null || webView21.CoreWebView2.Settings == null)
            {
                Trace.WriteLine("not ready");
                Application.Exit();
                return;
            }

#if !DEBUG
            webView21.CoreWebView2.Settings.AreBrowserAcceleratorKeysEnabled = false;
            webView21.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
#endif //DEBUG

            try
            {
                string path = Path.GetDirectoryName(Application.ExecutablePath)!;
                webView21.CoreWebView2.SetVirtualHostNameToFolderMapping(ROOT_ADDR, path + "\\gui",
                    Microsoft.Web.WebView2.Core.CoreWebView2HostResourceAccessKind.Allow);
            }
            catch
            {
                MessageBox.Show("Contents, GUI folders don't exist!");
                Application.Exit();
                return;
            }

            webView21.Source = new System.Uri(ROOT_URL + "index.html");
        }

        private void WebView21_NavigationCompleted(object sender, Microsoft.Web.WebView2.Core.CoreWebView2NavigationCompletedEventArgs e)
        {
            string exc = "var o=window.R5; if(o && o.wBase && o.wBase.w2a)o.wBase.w2a.start(function(c){";
            exc += "window.chrome.webview.postMessage(c)";
            exc += "})";
            webView21.CoreWebView2.ExecuteScriptAsync(exc);
        }

        bool _use_state = false;
        private void WebView21_WebMessageReceived(object sender, Microsoft.Web.WebView2.Core.CoreWebView2WebMessageReceivedEventArgs e)
        {
            string cmd = e.TryGetWebMessageAsString();
            const string wBase = "wBase:";
            int nd = cmd.IndexOf(wBase);
            if (nd != 0)
                return;
            cmd = cmd.Substring(wBase.Length);

            // register event handler
            const string szEvent = "event:";
            if (cmd.IndexOf(szEvent) == 0)
            {
                cmd = cmd.Substring(szEvent.Length);
                try
                {
                    JObject args = JObject.Parse(cmd);
                    string strType = args["type"]!.ToString();
                    _use_state = (bool)args["use"]!;
                    switch (strType)
                    {
                        case "state":
                            if (_use_state)
                            {
                                stateEnvironment(this, true);

                                JObject json = new JObject();
                                json.Add("state", "resume");
                                webView21.CoreWebView2.ExecuteScriptAsync("window.R5.wBase.evt.event(\"state\"," + json.ToString(Formatting.None) + ")");
                            }
                            break;
                    }
                }
                catch (Exception)
                {
                }
                return;
            }

            MessageReceived(cmd, this);
        }


        public void R5vAppProxy_Event(string type, string arg)
        {
            webView21.CoreWebView2.ExecuteScriptAsync("window.R5.wBase.evt.event(\"" + type + "\"," + arg + ")");
        }

        bool _use_state_proxy = false;
        public void R5vAppProxy_MessageFromProxy(string cmd)
        {
            // register event handler
            const string szEvent = "event:";
            if (cmd.IndexOf(szEvent) == 0)
            {
                cmd = cmd.Substring(szEvent.Length);
                try
                {
                    JObject args = JObject.Parse(cmd);
                    string strType = args["type"]!.ToString();
                    _use_state_proxy = (bool)args["use"]!;
                    switch (strType)
                    {
                        case "state":
                            if (_use_state_proxy)
                            {
                                stateEnvironment(_R5vAppProxy, true);

                                JObject json = new JObject();
                                json.Add("state", "resume");
                                _R5vAppProxy.R5vAppProxy_Event("state", json.ToString(Newtonsoft.Json.Formatting.None));
                            }
                            break;
                    }
                }
                catch (Exception)
                {
                }
                return;
            }

            MessageReceived(cmd, _R5vAppProxy);
        }

        public void R5vAppProxy_Notify(int key, string arg)
        {
            if (key == 0)
                return;
            string exc = "window.R5.wBase.cmd.notify(" + key + "," + arg + ")";
            try
            {
                if (webView21.CoreWebView2 != null)
                    webView21.CoreWebView2.ExecuteScriptAsync(exc);
            }
            catch { }
        }

        private void MessageReceived(string cmd, IR5vAppProxy ivApp)
        {
            const string szExitApp = "EXIT_APP:";
            if (cmd.IndexOf(szExitApp) == 0)
            {
                Application.Exit();
                return;
            }

            OnR5Command(cmd, ivApp);
        }

        public enum LCTYPE : uint
        {
            LOCALE_SISO639LANGNAME = 0x00000059,
            LOCALE_SISO3166CTRYNAME = 0x0000005A
        }
        [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
        public static extern int GetLocaleInfoEx(String lpLocaleName, LCTYPE LCType, StringBuilder lpLCData, int cchData);

        int _widthForm = 1;
        private void stateEnvironment(IR5vAppProxy ivApp, bool use_state)//(enum all, kr, ...)
        {
            if (!use_state)
                return;

            JObject json = new JObject();
            json.Add("state", "environment");

            StringBuilder data = new StringBuilder(500);
            GetLocaleInfoEx(null!, LCTYPE.LOCALE_SISO639LANGNAME, data, 500);
            string strLang = data.ToString();
            GetLocaleInfoEx(null!, LCTYPE.LOCALE_SISO3166CTRYNAME, data, 500);
            string strCountry = data.ToString();
            json.Add("locale", strLang + "-" + strCountry);

            const float pixelWidthBase = 1920; //@@
            if (this.WindowState != FormWindowState.Minimized)
            {
                Point ptC = new Point(this.Left + this.Width / 2, this.Top + this.Height / 2);

                _widthForm = this.Width;
            }
            json.Add("screen_density", (float)_widthForm / pixelWidthBase);

            if (_use_state)
                ivApp.R5vAppProxy_Event("state", json.ToString(Newtonsoft.Json.Formatting.None));
        }

        private void OnR5Command(string cmd, IR5vAppProxy ivApp)
        {
            if (OnR5Cmd_GET_PREFERENCES(cmd, ivApp))
                return;
            /*if (OnR5Cmd_SET_PREFERENCES(cmd, ivApp))
                return;*/
            Debug.Print("!!! unknown command: " + cmd);
        }

        private bool OnR5Cmd_GET_PREFERENCES(string cmd, IR5vAppProxy ivApp)
        {
            const string szGetPreferences = "GET_PREFERENCES:";
            if (cmd.IndexOf(szGetPreferences) != 0)
                return false;

            int r5Id = 0;

            cmd = cmd.Substring(szGetPreferences.Length);
            try
            {
                // 강제종료
                r5Id = Int32.Parse(cmd);
                ivApp.R5vAppProxy_Notify(r5Id, "{\"state\":\"closed\",\"result\":\"ok\"}");
                return true;
            }
            catch (FormatException) { }

            try
            {
                JObject args = JObject.Parse(cmd);
                r5Id = (int)args["__ID__"]!;
            }
            catch (Exception)
            {
                ivApp.R5vAppProxy_Notify(r5Id, "{\"state\":\"closed\",\"result\":\"error\",\"error\":1,\"msg\":\"Exception\"}");
                return true;
            }

            JObject json = new JObject();
            json.Add("state", "closed");

            json.Add("app_version", Program.VERSION);
#if DEBUG
            json.Add("debug", true);
#endif //DEBUG

            json.Add("result", "ok");
            ivApp.R5vAppProxy_Notify(r5Id, json.ToString(Newtonsoft.Json.Formatting.None));
            return true;
        }
    }
}


