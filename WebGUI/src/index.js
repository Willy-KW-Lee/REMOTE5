import React from 'react';
import ReactDOM from 'react-dom/client';
import R5 from './R5';
import App from './App';
import reportWebVitals from './reportWebVitals';
import Lang from './R5Lang';

let refRoot = React.createRef(null);

let startReactDOM = e=>{
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App ref={refRoot} />
    </React.StrictMode>
  );

    R5.wStyle(`
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
`);
}

if (!window.startReactDOM)
    window.startReactDOM = startReactDOM;
else
    startReactDOM();

reportWebVitals();

/* override */
window.r5_locale = locale_code=>
{
  Lang.Locale(locale_code, e=>{
    if (refRoot.current != null)
      refRoot.current.forceUpdate();
  });
}