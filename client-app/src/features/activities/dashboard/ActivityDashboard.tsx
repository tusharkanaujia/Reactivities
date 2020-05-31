import React, { useContext, useEffect, useState } from "react";
import { Grid, Loader, Label } from "semantic-ui-react";
import { observer } from "mobx-react-lite";
import ActivityList from "./ActivityList";
import { LoadingComponent } from "../../../app/layout/LoadingComponent";
import { RootStoreContext } from "../../../app/stores/rootStore";
import InfiniteScroll from "react-infinite-scroller";
import ActivityFilters from "./ActivityFilters";

const ActivityDashboard: React.FC = () => {
  const rootStore = useContext(RootStoreContext);
  const {
    loadActivities,
    loadingInitial,
    setPage,
    page,
    totalPages,
  } = rootStore.activityStore;
  const [loadingNext, setLoadingNext] = useState(false);

  const handleGetNext = () => {
    setLoadingNext(true);
    setPage(page + 1);
    loadActivities().then(() => setLoadingNext(false));
  };
  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  if (loadingInitial && page === 0) {
    return <LoadingComponent content="Loading Activities..." />;
  }
  return (
    <Grid>
      <Grid.Column width={10}>
        <InfiniteScroll 
          pageStart={0}
          loadMore={handleGetNext}
          hasMore={!loadingNext && page+1 < totalPages}
          initialLoad={false}
          >
          <ActivityList />
        </InfiniteScroll>
      </Grid.Column>
      <Grid.Column width={6}>
        <ActivityFilters/>
      </Grid.Column>
      <Grid.Column width={10}>
        <Loader active={loadingNext} />
        {totalPages === page + 1 ? <Label> <Label.Detail>No more activities to load</Label.Detail></Label>:null}
      </Grid.Column>
    </Grid>
  );
};

export default observer(ActivityDashboard);
