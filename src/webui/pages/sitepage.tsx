import {Component, h} from 'preact';

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
    console.log(this.state);
    return (
      <div class="SitePage">
        Sites: Result: {this} {this.state.siteId}
      </div>
    );
  }
}
