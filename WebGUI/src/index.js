import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import Lang from './Lang';

let refRoot = React.createRef(null);

let startReactDOM = e=>{
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App ref={refRoot} />
    </React.StrictMode>
  );
}

if (!window.startReactDOM)
    window.startReactDOM = startReactDOM;
else
    startReactDOM();

reportWebVitals();

/* override */
window.r5_locale = locale_code=>
{
  Lang().Locale(locale_code, e=>{
    if (refRoot.current != null)
      refRoot.current.forceUpdate();
  });
}