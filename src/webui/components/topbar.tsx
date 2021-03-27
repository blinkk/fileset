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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 102.01 124.69"
              >
                <path
                  d="M114.91,46.38a5.66,5.66,0,0,0-5.14-3.28H78.54l20.9-32.85a5.66,5.66,0,0,0-4.78-8.71h-34a5.67,5.67,0,0,0-4.91,2.83L14.19,76.16a5.66,5.66,0,0,0,4.9,8.5H53.24l-9.39,34.41a5.67,5.67,0,0,0,2.84,6.51,5.59,5.59,0,0,0,2.63.65,5.69,5.69,0,0,0,4.34-2l10.77-12.8,49.68-59A5.66,5.66,0,0,0,114.91,46.38Z"
                  transform="translate(-13.43 -1.54)"
                  style="fill:#f2d23d"
                />
                <path
                  d="M46.69,125.58a5.59,5.59,0,0,0,2.63.65,5.69,5.69,0,0,0,4.34-2l10.77-12.8V1.54H60.66a5.67,5.67,0,0,0-4.91,2.83L14.19,76.16a5.66,5.66,0,0,0,4.9,8.5H53.24l-9.39,34.41A5.67,5.67,0,0,0,46.69,125.58Z"
                  transform="translate(-13.43 -1.54)"
                  style="fill:#eebf00"
                />
              </svg>
              Fileset
            </Link>
          </div>
          <div class="TopBar__inner__user">
            <div class="TopBar__inner__user__image">
              {this.state.me && this.state.me.photos && (
                <img src={this.state.me.photos[0].value} alt="" />
              )}
            </div>
            <div class="TopBar__inner__user__details">
              <div class="TopBar__inner__user__details__name">
                {(this.state.me && this.state.me.displayName) || '...'}
              </div>
              <div class="TopBar__inner__user__details__email">
                {(this.state.me &&
                  this.state.me.emails &&
                  this.state.me.emails[0].value) ||
                  '...'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
