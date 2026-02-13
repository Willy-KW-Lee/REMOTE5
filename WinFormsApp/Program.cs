namespace WinFormsApp
{
    internal static class Program
    {
        public const string VERSION = "1.0b";

        /// <summary>
        ///  The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main()
        {
            ApplicationConfiguration.Initialize();
            Application.Run(new Form());
        }
    }
}