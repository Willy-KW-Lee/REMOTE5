import React from "react";
import logo from './logo.svg';
import R5 from './R5';
import Lang from './R5Lang';
import App_en_US from "./App_en-US.json";

class App extends React.Component {
  async componentDidMount() {
    this.langMain = Lang.Add("App_", e=>{this.forceUpdate()}, App_en_US);
    R5.wStyle.load("App.css", obj=>{this.styleMain=obj});

    R5.command(
      "GET_PREFERENCES",
      {},
      args=>{
        console.log(args);
      }
    );
  }

  componentWillUnmount() {
    if (this.langMain != null) {
      Lang.Remove(this.langMain);
      this.langMain = null;
    }
		if (this.styleMain != null) {
			this.styleMain.destroy();
			this.styleMain = null;
		}
  } 

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.<br/>
            {Lang("test","App")}
          </p>
        </header>
      </div>
    );
  }
}

export default App;
