import R5 from './R5';
import React from "react";
import Lang from './Lang';

class Test extends React.Component {
  constructor(props) {
    super(props);
  }

  async componentDidMount() {
    R5.command(
      "GET_PREFERENCES",
      {},
      args=>{
        console.log(args);
      }
    );
  }

  render() {
    return (
      <div onClick={e=>{this.forceUpdate()}}>
        {Lang("aaa","Test")}
      </div>
    );
  }
}

export default Test;
