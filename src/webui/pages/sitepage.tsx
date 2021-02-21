import {Component, h} from 'preact';

import {Link} from 'preact-router/match';
import {Page} from './page';

interface SitePageProps {
  path: string;
  siteId?: string;
}

interface SitePageState {
  currentPath: string;
  siteId: string;
}

export class SitePage extends Page<SitePageProps, SitePageState> {
  constructor(props: SitePageProps) {
    super(props);
    this.state = {
      currentPath: '',
      siteId: props.siteId,
    };
  }
  render() {
    return (
      <div class="SitePage">
        <div class="SitePage__title">
          Site:&nbsp;
          <Link href={`/fileset/sites/${this.state.siteId}`}>
            {this.state.siteId}
          </Link>
        </div>
        <div class="SitePage__content">
          <div class="SitePage__content__table">
            <div class="SitePage__content__table__title">
              Scheduled launches
            </div>
            <table>
              <thead>
                <tr>
                  <td>TTL</td>
                  <td>Commit</td>
                  <td>Modified</td>
                  <td>Staging Link</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Master</td>
                  <td>
                    <Link href="/fileset/sites/default/abc">abc</Link>
                  </td>
                  <td>2020/10/19 05:12</td>
                  <td>
                    <a href="#">Link</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="SitePage__content__table">
            <div class="SitePage__content__table__title">Previews</div>
            <table>
              <thead>
                <tr>
                  <td>Branch</td>
                  <td>Commit</td>
                  <td>Modified</td>
                  <td>Staging Link</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Master</td>
                  <td>3259ae</td>
                  <td>2020/10/19 05:12</td>
                  <td>
                    <a href="#">Link</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}
