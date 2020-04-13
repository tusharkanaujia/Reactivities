import React, { useEffect, Fragment, useContext } from "react";
import { Container } from "semantic-ui-react";
import { IActivity } from "../models/activity";
import NavBar from "../../features/nav/NavBar";
import { LoadingComponent } from "./LoadingComponent";
import ActivityStore from "../stores/activityStore";
import { observer } from "mobx-react-lite";
import ActivityDashboard from "../../features/activities/dashboard/ActivityDashboard";

interface IState {
  activities: IActivity[];
}

const App = () => {
  const activityStore = useContext(ActivityStore);

  useEffect(() => {
    activityStore.loadActivities();
  }, [activityStore]);

  if (activityStore.loadingInitial) {
    return <LoadingComponent content="Loading Activities..." />;
  }

  return (
    <Fragment>
      <NavBar />
      <Container style={{ marginTop: "7em" }}>
        <ActivityDashboard />
      </Container>
    </Fragment>
  );
};

export default observer(App);
