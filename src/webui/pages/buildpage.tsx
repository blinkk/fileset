import {Component, h} from 'preact';

import {Page} from './page';

interface BuildPageProps {
  path: string;
  siteId?: string;
  ref?: string;
}

interface BuildPageState {
  currentPath: string;
  siteId: string;
  ref: string;
}

export class BuildPage extends Page<BuildPageProps, BuildPageState> {
  constructor(props: BuildPageProps) {
    super(props);
    this.state = {
      currentPath: '',
      siteId: props.siteId,
      ref: props.ref,
    };
  }
  render() {
    return (
      <div class="BuildPage">
        <div class="BuildPage__title">
          Site: {this.state.siteId} @ {this.state.ref}
        </div>
        <div class="BuildPage__content">
          <div class="BuildPage__content__table">
            <div class="BuildPage__content__table__title">Files</div>
            <table>
              <thead>
                <tr>
                  <td>Path</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>/about/</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="BuildPage__content__table">
            <div class="BuildPage__content__table__title">Redirects</div>
            <table>
              <thead>
                <tr>
                  <td>From</td>
                  <td>To</td>
                  <td>Permanent</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Master</td>
                  <td>3259ae</td>
                  <td>2020/10/19 05:12</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}
