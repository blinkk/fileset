import {Component, h} from 'preact';

import {Link} from 'preact-router/match';
import {rpc} from '../utils/rpc';

interface TopBarState {
  me: any;
}

export class TopBar extends Component<any, TopBarState> {
  onMenuClick = () => {
    console.log('onMenuClick()');
    if (this.props.onMenuClick) {
      this.props.onMenuClick();
    }
  };

  async componentDidMount() {
    try {
      const resp: any = await rpc('user.me', {});
      this.setState({
        me: resp.me,
      });
    } catch (err) {
      console.error(err);
    }
  }

  render() {
    return (
      <div class="TopBar">
        <div class="TopBar__inner">
          <div class="TopBar__inner__logo">
            <Link class="TopBar__inner__logo__link" href="/fileset/">
              Fileset
            </Link>
          </div>
          <div class="TopBar__inner__user">
            <div class="TopBar__inner__user__image">
              {this.state.me && this.state.me.photos && (
                <img src={this.state.me.photos[0].value} alt="" />
              )}
            </div>
            <div class="TopBar__inner__user__name">
              {(this.state.me && this.state.me.displayName) || '...'}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
