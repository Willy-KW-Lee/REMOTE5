import React from "react";
import logo from './logo.svg';
import './App.css';
import R5 from './R5';
import Lang from './Lang';
import App_en_US from "./App_en-US.json";
import Test from './Test';

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  async componentDidMount() {
    this.langMain = Lang().Add("App_", e=>{this.forceUpdate()}, App_en_US);

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
      Lang().Remove(this.langMain);
      this.langMain = null;
    }
  } 

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p onClick={e=>{this.forceUpdate()}}>
            Edit <code>src/App.js</code> and save to reload.{Lang("test","App")}
          </p>
        </header>
        <Test style={{ background:"#fff", left:0, bottom:0, width:"50%", height:"10%"}}></Test>
      </div>
    );
  }
}

export default App;
