import React, { useContext, Fragment } from "react";
import { Item, Label } from "semantic-ui-react";
import { observer } from "mobx-react-lite";
import ActivityStore from "../../../app/stores/activityStore";
import ActivityItemList from "./ActivityItemList";

const ActivityList: React.FC = () => {
  const activityStore = useContext(ActivityStore);
  const { actvitiesByDate } = activityStore;
  return (
    <Fragment>
      {actvitiesByDate.map(([group, activities]) => (
        <Fragment key={group}>
          <Label size="large" color="blue">{group}</Label>
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
