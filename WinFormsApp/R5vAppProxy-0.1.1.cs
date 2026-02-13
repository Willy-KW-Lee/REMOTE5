// 2022-12-12 - R5vAppProxy

using System;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

public interface IR5vAppProxy
{
    public void R5vAppProxy_MessageFromProxy(string cmd);
    public void R5vAppProxy_Event(string type, string arg);
    public void R5vAppProxy_Notify(int key, string arg);
}

public class R5vAppProxy : IR5vAppProxy
{
    [DllImport("kernel32.dll")]
    static extern IntPtr LoadLibrary(string dllToLoad);
    [DllImport("kernel32.dll")]
    static extern IntPtr GetProcAddress(IntPtr hModule, string procedureName);

    IntPtr _hR5vAppRelay = IntPtr.Zero;
    IR5vAppProxy? _iR5vAppProxy = null;

    IntPtr _hDll = IntPtr.Zero;
    [UnmanagedFunctionPointer(CallingConvention.StdCall)]
    delegate IntPtr FnR5vAppRelay_Open(int port);
    FnR5vAppRelay_Open? _R5vAppRelay_Open = null;
    [UnmanagedFunctionPointer(CallingConvention.StdCall)]
    delegate int FnR5vAppRelay_Close(IntPtr hR5vAppRelay);
    FnR5vAppRelay_Close? _R5vAppRelay_Close = null;
    [UnmanagedFunctionPointer(CallingConvention.StdCall, CharSet = CharSet.Unicode)]
    delegate int FnR5vAppRelay_Send(IntPtr hR5vAppRelay, string lpcsz);
    FnR5vAppRelay_Send? _R5vAppRelay_Send = null;
    [UnmanagedFunctionPointer(CallingConvention.StdCall, CharSet = CharSet.Unicode)]
    delegate int FnR5vAppRelay_Receive(IntPtr hR5vAppRelay, StringBuilder sb, int size);
    FnR5vAppRelay_Receive? _R5vAppRelay_Receive = null;

    public R5vAppProxy()
    {
        _hDll = LoadLibrary("R5vAppRelay.dll");
        if (_hDll != IntPtr.Zero)
        {
            IntPtr fn = GetProcAddress(_hDll, "R5vAppRelay_Open");
            if (fn != IntPtr.Zero)
                _R5vAppRelay_Open = (FnR5vAppRelay_Open)Marshal.GetDelegateForFunctionPointer(fn, typeof(FnR5vAppRelay_Open));
            fn = GetProcAddress(_hDll, "R5vAppRelay_Close");
            if (fn != IntPtr.Zero)
                _R5vAppRelay_Close = (FnR5vAppRelay_Close)Marshal.GetDelegateForFunctionPointer(fn, typeof(FnR5vAppRelay_Close));
            fn = GetProcAddress(_hDll, "R5vAppRelay_Send");
            if (fn != IntPtr.Zero)
                _R5vAppRelay_Send = (FnR5vAppRelay_Send)Marshal.GetDelegateForFunctionPointer(fn, typeof(FnR5vAppRelay_Send));
            fn = GetProcAddress(_hDll, "R5vAppRelay_Receive");
            if (fn != IntPtr.Zero)
                _R5vAppRelay_Receive = (FnR5vAppRelay_Receive)Marshal.GetDelegateForFunctionPointer(fn, typeof(FnR5vAppRelay_Receive));
        }
    }

    public bool Connect(IR5vAppProxy iR5vAppProxy, int port)
    {
        if (_hR5vAppRelay != IntPtr.Zero)
            return false;
        if (_R5vAppRelay_Open != null)
            _hR5vAppRelay = _R5vAppRelay_Open(port);

        _iR5vAppProxy = iR5vAppProxy;
        if (_hR5vAppRelay != IntPtr.Zero && _R5vAppRelay_Receive != null)
            asyncReceive();

        return true;
    }

    public void Close()
    {
        if (_hR5vAppRelay == IntPtr.Zero)
            return;

        _iR5vAppProxy = null;

        if (_R5vAppRelay_Close != null)
            _R5vAppRelay_Close(_hR5vAppRelay);
        _hR5vAppRelay = IntPtr.Zero;
    }

    async void asyncReceive()
    {
        const int sb_len = 1024;
        StringBuilder sb = new StringBuilder(sb_len);
        string msg = "";
        while (_iR5vAppProxy != null)
        {
            int rcv = -1;

            await Task.Run(() =>
            {
                Debug.Print("from R5: ");
                if (_R5vAppRelay_Receive != null)
                {
                    rcv = _R5vAppRelay_Receive(_hR5vAppRelay, sb, sb_len);
                    string pck = sb.ToString();
                    msg += pck;
                }
            });
            if (rcv == sb_len)
                continue;

            R5vAppProxy_MessageFromProxy(msg);
            msg = "";
        }
    }

    public void R5vAppProxy_MessageFromProxy(string cmd)
    {
        if (_iR5vAppProxy != null)
            _iR5vAppProxy.R5vAppProxy_MessageFromProxy(cmd);
    }

    public void R5vAppProxy_Event(string type, string arg)
    {
        string pckt = type + ":" + arg;
        sendToProxy(pckt);
    }

    public void R5vAppProxy_Notify(int key, string arg)
    {
        string pckt = key + ":" + arg;
        sendToProxy(pckt);
    }

    bool sendToProxy(string cmd)
    {
        if (_hR5vAppRelay == IntPtr.Zero)
            return false;

        if (_R5vAppRelay_Send == null)
            return false;
        Debug.Print("to R5s: " + cmd);
        bool b = _R5vAppRelay_Send(_hR5vAppRelay, cmd) != 0;
        Debug.Print(" return R5s");
        return b;
    }
}
