import {Component, h, render} from 'preact';

interface MainState {
  currentPath: string;
}

class Main extends Component<unknown, MainState> {
  constructor() {
    super();
    this.state = {
      currentPath: window.location.pathname,
    };
  }
  render() {
    return <div>hello world!</div>;
  }
}

const container = document.querySelector('.webui');
render(<Main />, container);
