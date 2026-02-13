using Newtonsoft.Json.Linq;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;

namespace WinFormsApp
{
    public partial class Form : System.Windows.Forms.Form, IR5vAppProxy
    {
        R5vAppProxy? _R5vAppProxy = null;

        public Form()
        {
            InitializeComponent();
            this.FormClosed += Form_FormClosed;
            this.SizeChanged += Form_SizeChanged;

#if DEBUG
            _R5vAppProxy = new R5vAppProxy();
            if (!_R5vAppProxy.Connect(this, 1080))
                _R5vAppProxy = null;
            else
                this.WindowState = FormWindowState.Minimized;
#endif //DEBUG
        }

        private void Form_SizeChanged(object? sender, EventArgs e)
        {
            stateEnvironment(_R5vAppProxy == null ? this : _R5vAppProxy);
        }

        private void Form_FormClosed(object? sender, FormClosedEventArgs e)
        {
            if (_R5vAppProxy != null)
            {
                _R5vAppProxy.Close();
                _R5vAppProxy = null;
            }
        }

        public void R5vAppProxy_Event(string type, string arg)
        {
            // No own GUI
            // do nothing
        }

        public void R5vAppProxy_MessageFromProxy(string cmd)
        {
            MessageReceived(cmd, _R5vAppProxy!);
        }

        public void R5vAppProxy_Notify(int key, string arg)
        {
            // No own GUI
            // do nothing
        }

        bool _use_state = false;
        private void MessageReceived(string cmd, IR5vAppProxy ivApp)
        {
            // register event handler
            const string szEvent = "event:";
            if (cmd.IndexOf(szEvent) == 0)
            {
                cmd = cmd.Substring(szEvent.Length);
                try
                {
                    JObject args = JObject.Parse(cmd);
                    string strType = args["type"].ToString();
                    _use_state = (bool)args["use"];
                    switch (strType)
                    {
                        case "state":
                            if (_use_state)
                            {
                                stateEnvironment(ivApp);

                                JObject json = new JObject();
                                json.Add("state", "resume");
                                ivApp.R5vAppProxy_Event("state", json.ToString(Newtonsoft.Json.Formatting.None));
                            }
                            break;
                    }
                }
                catch (Exception)
                {
                }
                return;
            }

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
        private void stateEnvironment(IR5vAppProxy ivApp)//(enum all, kr, ...)
        {
            if (!_use_state)
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
                r5Id = (int)args["__ID__"];
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


