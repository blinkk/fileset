import {Component, h} from 'preact';

interface DefaultPageState {
  currentPath: string;
}

export class Page<
  P = {},
  S extends DefaultPageState = DefaultPageState
> extends Component<P, S> {
  componentDidUpdate(prevProps: any) {
    if (window.location.pathname !== this.state.currentPath) {
      this.setState({
        currentPath: window.location.pathname,
      });
      this.onRouteChange();
    }
  }

  onRouteChange() {}

  renderMain() {
    return <div />;
  }

  render() {
    return <div class="Main">{this.renderMain()}</div>;
  }
}
