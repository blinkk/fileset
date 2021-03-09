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
}

interface SitePageState {
  currentPath: string;
  siteId: string;
  manifests: Array<any>;
  loading: boolean;
}

export class SitePage extends Page<SitePageProps, SitePageState> {
  constructor(props: SitePageProps) {
    super(props);
    this.state = {
      currentPath: '',
      siteId: props.siteId,
      loading: false,
      manifests: [],
    };
  }

  async componentDidMount() {
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

  filterManifests(manifests: Array<any>) {
    return manifests.sort(
      (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()
    );
  }

  renderLoading() {
    return <Loading />;
  }

  renderManifestTable() {
    return this.state.manifests && this.state.manifests.length ? (
      <div class="SitePage__content__table">
        <div class="SitePage__content__table__title">Staging links</div>
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
                <td>{manifest.ref.slice(0, 7)}</td>
                <td>{prettyDate(manifest.modified)}</td>
                <td>{Object.keys(manifest.paths).length}</td>
                <td>
                  <a
                    href={createStagingLink(
                      window.location.href,
                      manifest.site,
                      manifest.branch,
                      manifest.ref
                    )}
                  >
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
          {/*
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
          */}
          {this.state.loading
            ? this.renderLoading()
            : this.renderManifestTable()}
        </div>
      </div>
    );
  }
}
