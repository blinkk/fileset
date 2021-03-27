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
    try {
      this.setState({loading: true});
      const resp: any = await rpc('manifest.list', {
        site: this.state.siteId,
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

  async componentWillReceiveProps(props: SitePageProps) {
    this.setState({tab: props.tab});
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
          {this.state.tab === undefined ? this.renderManifestTable() : ''}
          {this.state.tab === 'history' ? this.renderManifestTable() : ''}
        </div>
      </div>
    );
  }

  renderManifestTable() {
    return this.state.manifests && this.state.manifests.length ? (
      <div class="SitePage__content__table">
        <table>
          <thead>
            <tr>
              <th>Branch</th>
              <th>Commit</th>
              <th>Modified</th>
              <th>Files</th>
              <th>Staging link</th>
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
            href="https://github.com/blinkkcode/fileset#deployment-setup"
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
        <div class="SitePage__content">
          {this.state.loading ? this.renderLoading() : this.renderTabSet()}
        </div>
      </div>
    );
  }
}
