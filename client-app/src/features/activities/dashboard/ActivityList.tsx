import React, { useContext, Fragment } from "react";
import { Item, Label } from "semantic-ui-react";
import { observer } from "mobx-react-lite";
import ActivityItemList from "./ActivityItemList";
import { RootStoreContext } from "../../../app/stores/rootStore";
import { format } from "date-fns";

const ActivityList: React.FC = () => {
  const rootStore = useContext(RootStoreContext);
  const { actvitiesByDate } = rootStore.activityStore;
  return (
    <Fragment>
      {actvitiesByDate.map(([group, activities]) => (
        <Fragment key={group}>
          <Label size="large" color="blue">{format(group, 'eeee do MMMM')}</Label>
            <Item.Group divided>
              {activities.map((activity) => (
                <ActivityItemList key={activity.id} activity={activity} />
              ))}
            </Item.Group>
        </Fragment>
      ))}
    </Fragment>
  );
};

export default observer(ActivityList);
