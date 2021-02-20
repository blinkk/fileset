import {Component, h} from 'preact';

export class TopBar extends Component<any, any> {
  onMenuClick = () => {
    console.log('onMenuClick()');
    if (this.props.onMenuClick) {
      this.props.onMenuClick();
    }
  };

  render() {
    return (
      <div class="TopBar">
        <div class="TopBar__inner">
          <div class="TopBar__inner__logo">Fileset</div>
        </div>
      </div>
    );
  }
}
