import {Component, h} from 'preact';

import {Link} from 'preact-router/match';
import {Page} from './page';
import {rpc} from '../utils/rpc';

interface SitePageProps {
  path: string;
  siteId?: string;
}

interface SitePageState {
  currentPath: string;
  siteId: string;
  manifests: Array<any>;
}

export class SitePage extends Page<SitePageProps, SitePageState> {
  constructor(props: SitePageProps) {
    super(props);
    this.state = {
      currentPath: '',
      siteId: props.siteId,
      manifests: [],
    };
  }

  async componentDidMount() {
    try {
      const resp: any = await rpc('manifest.list', {
        site: this.state.siteId,
      });
      this.setState({manifests: resp.manifests});
    } catch (err) {
      console.error(err);
    }
  }

  filterManifests(manifests: Array<any>) {
    return manifests;
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
                  <th>Branch</th>
                  <th>Commit</th>
                  <th>Modified</th>
                  <th>Files</th>
                  <th>Staging Link</th>
                </tr>
              </thead>
              <tbody>
                {this.state.manifests ? (
                  this.filterManifests(this.state.manifests).map(
                    (manifest, i) => (
                      <tr>
                        <td>{manifest.branch}</td>
                        <td>{manifest.ref.slice(0, 7)}</td>
                        <td>{manifest.modified}</td>
                        <td>{Object.keys(manifest.paths).length}</td>
                        <td>
                          <a href="#">Link</a>
                        </td>
                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td>Loading...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}
