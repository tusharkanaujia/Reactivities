import React, { useContext, useEffect } from "react";
import { Grid } from "semantic-ui-react";
import { observer } from "mobx-react-lite";
import { RouteComponentProps } from "react-router-dom";
import { LoadingComponent } from "../../../app/layout/LoadingComponent";
import { ActivityDetailedInfo } from "./ActivityDetailedInfo";
import ActivityDetailedHeader from "./ActivityDetailedHeader";
import { RootStoreContext } from "../../../app/stores/rootStore";
import ActivityDetailedSideBar from "./ActivityDetailedSideBar";
import ActivityDetailedChat from "./ActivityDetailedChat";

interface DetailsParams {
  id: string;
}

const ActivityDetails: React.FC<RouteComponentProps<DetailsParams>> = ({
  match,
  history
}) => {
  const rootStore = useContext(RootStoreContext);
  const { activity, loadActivity, loadingInitial } = rootStore.activityStore;

  useEffect(() => {
    loadActivity(match.params.id)
  }, [loadActivity, match.params.id, history]);

  if (loadingInitial || !activity) {
    return <LoadingComponent content="Loading activity..." />;
  }

  if (!activity) {
    return <h2>Activity Not found</h2>
  }

  return (
    <Grid>
      <Grid.Column width={10}>
        <ActivityDetailedHeader activity={activity} />
        <ActivityDetailedInfo activity={activity}/>
        <ActivityDetailedChat />
      </Grid.Column>
      <Grid.Column width={6}>
        <ActivityDetailedSideBar attendees={activity.attendees} />
      </Grid.Column>
    </Grid>
  );
};

export default observer(ActivityDetails);
