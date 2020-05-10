import React, { useState, useContext, useEffect } from "react";
import { Segment, Form, Button, Grid, FormGroup } from "semantic-ui-react";
import {ActivityFormValues} from "../../../app/models/activity";
import { v4 as uuid } from "uuid";
import { observer } from "mobx-react-lite";
import ActivityStore from "../../../app/stores/activityStore";
import { RouteComponentProps } from "react-router-dom";
import { Form as FinalForm, Field } from "react-final-form";
import TextInput from "../../../app/common/form/TextInput";
import TextAreaInput from "../../../app/common/form/TestAreaInput";
import SelectInput from "../../../app/common/form/SelectInput";
import { category } from "../../../app/common/options/categoryOptions";
import DateInput from "../../../app/common/form/DateInput";
import { combineDateAndTime } from "../../../app/common/util/util";
import {combineValidators, isRequired, composeValidators, hasLengthGreaterThan} from 'revalidate';

const validate = combineValidators({
  title: isRequired({message: 'The title is required'}),
  category: isRequired('Category'),
  description: composeValidators(
    isRequired('Description'),
    hasLengthGreaterThan(4)({message: 'Description should be more then 5 characters'})
  )(''),
  city: isRequired('City'),
  venue: isRequired('Venue'),
  date: isRequired('Date'),
  time: isRequired('Time')
})

interface DetailsParams {
  id: string;
}

const ActivityForm: React.FC<RouteComponentProps<DetailsParams>> = ({
  match,
  history,
}) => {
  const activityStore = useContext(ActivityStore);
  const {
    createActivity,
    editActivity,
    submitting,
    loadActivity,
  } = activityStore;

  const [activity, setActivity] = useState(new ActivityFormValues());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (match.params.id) {
      setLoading(true);
      loadActivity(match.params.id)
        .then((activity) => setActivity(new ActivityFormValues(activity)))
        .finally(() => setLoading(false));
    }
  }, [loadActivity, match.params.id]);

  const handleFinalFormSubmit = (values: any) => {
    const dateAndTime = combineDateAndTime(values.date, values.time);
    const { date, time, ...activity } = values;
    activity.date = dateAndTime;
    if (!activity.id) {
      let newActivity = {
        ...activity,
        id: uuid(),
      };
      createActivity(newActivity);
    } else {
      editActivity(activity);
    }
  };

  return (
    <Grid>
      <Grid.Column width={10}>
        <Segment clearing>
          <FinalForm
            validate={validate}
            initialValues={activity}
            onSubmit={handleFinalFormSubmit}
            render={({ handleSubmit, invalid, pristine }) => (
              <Form onSubmit={handleSubmit} loading={loading}>
                <Field
                  placeholder="Title"
                  name="title"
                  value={activity.title}
                  component={TextInput}
                />
                <Field
                  placeholder="Description"
                  name="description"
                  value={activity.description}
                  rows={3}
                  component={TextAreaInput}
                />
                <Field
                  placeholder="Category"
                  name="category"
                  value={activity.category}
                  options={category}
                  component={SelectInput}
                />
                <Form.Group>
                  <Field
                    placeholder="Date"
                    name="date"
                    date={true}
                    value={activity.date}
                    component={DateInput}
                  />
                  <Field
                    placeholder="Time"
                    name="time"
                    time={true}
                    value={activity.date}
                    component={DateInput}
                  />
                </Form.Group>
                <Field
                  placeholder="City"
                  name="city"
                  value={activity.city}
                  component={TextInput}
                />
                <Field
                  placeholder="Vanve"
                  name="venue"
                  value={activity.venue}
                  component={TextInput}
                />
                <Button
                  loading={submitting}
                  disabled={loading|| invalid || pristine}
                  floated="right"
                  positive
                  type="submit"
                  content="Submit"
                />
                <Button
                  disabled={loading}
                  floated="right"
                  type="submit"
                  content="Cancel"
                  onClick={
                    activity.id
                      ? () => history.push(`/activities/${activity.id}`)
                      : () => history.push("/activities")
                  }
                />
              </Form>
            )}
          />
        </Segment>
      </Grid.Column>
    </Grid>
  );
};

export default observer(ActivityForm);
