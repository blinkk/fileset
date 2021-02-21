import {Component, h} from 'preact';

import {Link} from 'preact-router/match';

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
          <div class="TopBar__inner__logo">
            <Link class="TopBar__inner__logo__link" href="/fileset/">
              Fileset
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
