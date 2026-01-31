import {Component, h} from 'preact';

import {Link} from 'preact-router/match';
import {Loading} from '../components/loading';
import {Page} from './page';
import {createStagingLink} from '../utils/links';
import {prettyDate} from '../utils/formatters';
import {rpc} from '../utils/rpc';

interface SitePageProps {
  path: string;
  siteId?: string;
  tab?: string;
}

interface SitePageState {
  currentPath: string;
  siteId: string;
  manifests: Array<any>;
  loading: boolean;
  tab?: string;
}

export class SitePage extends Page<SitePageProps, SitePageState> {
  constructor(props: SitePageProps) {
    super(props);
    this.state = {
      currentPath: '',
      siteId: props.siteId,
      loading: false,
      manifests: [],
      tab: props.tab,
    };
  }

  async componentDidMount() {
    document.title = `${this.state.siteId} – Fileset`;
    this.updateTable(this.state.tab === undefined ? 'branch' : 'ref');
  }

  async componentWillReceiveProps(props: SitePageProps) {
    this.setState({tab: props.tab});
    this.updateTable(props.tab === undefined ? 'branch' : 'ref');
  }

  async updateTable(manifestType: string) {
    try {
      this.setState({loading: true});
      const resp: any = await rpc('manifest.list', {
        site: this.state.siteId,
        manifestType: manifestType,
      });
      this.setState({
        loading: false,
        manifests: resp.manifests,
      });
    } catch (err) {
      this.setState({loading: false});
      console.error(err);
    }
  }

  filterManifests(manifests: Array<any>) {
    return manifests.sort(
      (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()
    );
  }

  renderLoading() {
    return <Loading />;
  }

  renderTabSet() {
    return (
      <div class="BuildPage__tabset">
        <div class="BuildPage__tabset__bar">
          <Link
            className={`BuildPage__tabset__bar__tab ${
              this.state.tab === undefined
                ? 'BuildPage__tabset__bar__tab--active'
                : ''
            }`}
            href={this.state.currentPath}
          >
            <span class="material-icons-outlined">link</span>
            Staging links
          </Link>
          <Link
            className={`BuildPage__tabset__bar__tab ${
              this.state.tab === 'history'
                ? 'BuildPage__tabset__bar__tab--active'
                : ''
            }`}
            href={`${this.state.currentPath}?tab=history`}
          >
            <span class="material-icons-outlined">history</span>
            Builds
          </Link>
        </div>
        <div>
          {this.state.loading
            ? this.renderLoading()
            : this.renderManifestTable()}
        </div>
      </div>
    );
  }

  renderStagingLinkTable() {
    return (
      <div class="SitePage__content__table">
        <table>
          <thead>
            <tr>
              <th>Branch</th>
              <th data-extra-small>Commit</th>
              <th>Modified</th>
              <th data-extra-small>Files</th>
              <th data-extra-small>Staging link</th>
            </tr>
          </thead>
          <tbody>
            {this.filterManifests(this.state.manifests).map((manifest, i) => (
              <tr>
                <td>
                  <Link
                    href={`/fileset/sites/${
                      this.state.siteId
                    }/${encodeURIComponent(manifest.branch)}/`}
                  >
                    {manifest.branch}
                  </Link>
                </td>
                <td>
                  <code>{manifest.ref.slice(0, 7)}</code>
                </td>
                <td>{prettyDate(manifest.modified)}</td>
                <td>{Object.keys(manifest.paths).length}</td>
                <td>
                  <a
                    class="button button--tonal button--small"
                    href={createStagingLink(
                      window.location.href,
                      manifest.site,
                      manifest.branch,
                      manifest.ref
                    )}
                  >
                    <span class="material-icons-outlined">open_in_new</span>
                    Link
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  renderHistoryTable() {
    return (
      <div class="SitePage__content__table SitePage__content__table--bordered">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th data-extra-small>Commit</th>
              <th data-extra-small>Files</th>
              <th data-small>Links</th>
            </tr>
          </thead>
          <tbody>
            {this.filterManifests(this.state.manifests).map((manifest, i) => (
              <tr>
                <td>
                  {manifest.commit ? (
                    <div>
                      <div>{manifest.commit.message}</div>
                      <div>
                        <b>{manifest.commit.author.name}</b> authored on
                        {prettyDate(manifest.modified)}
                      </div>
                    </div>
                  ) : (
                    <small>(unknown)</small>
                  )}
                </td>
                <td>
                  <code>{manifest.ref.slice(0, 7)}</code>
                </td>
                <td>{Object.keys(manifest.paths).length}</td>
                <td>
                  <a
                    class="button button--tonal button--small"
                    href={`/fileset/sites/${
                      this.state.siteId
                    }/${encodeURIComponent(manifest.ref.slice(0, 7))}/`}
                  >
                    <span class="material-icons-outlined">view_list</span>
                    Details
                  </a>
                  <a
                    class="button button--tonal button--small"
                    href={createStagingLink(
                      window.location.href,
                      manifest.site,
                      '',
                      manifest.ref
                    )}
                  >
                    <span class="material-icons-outlined">open_in_new</span>
                    Staging
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  renderManifestTable() {
    return this.state.manifests && this.state.manifests.length ? (
      this.state.tab === 'history' ? (
        this.renderHistoryTable()
      ) : (
        this.renderStagingLinkTable()
      )
    ) : (
      <div class="SitePage__content__empty">
        <div class="SitePage__content__empty__headline">
          No staging links found
        </div>
        <div class="SitePage__content__empty__body">
          Deploy your first staging link by using the{' '}
          <code>fileset upload</code> command.
        </div>
        <div class="SitePage__content__empty__buttons">
          <a
            href="https://github.com/blinkk/fileset#deployment-setup"
            class="button button--medium"
          >
            View documentation
          </a>
        </div>
      </div>
    );
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
        <div class="SitePage__content">{this.renderTabSet()}</div>
      </div>
    );
  }
}
