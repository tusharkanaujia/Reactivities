import { observable, action, computed, runInAction } from "mobx";
import { SyntheticEvent } from "react";
import { IActivity } from "../models/activity";
import agent from "../api/agent";
import { history } from "../..";
import { toast } from "react-toastify";
import { RootStore } from "./rootStore";
import { setActivityProps, createAttendee } from "../common/util/util";
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";

export default class ActivityStore {
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
  }

  @observable activityRegistry = new Map();
  @observable activity: IActivity | null = null;
  @observable loadingInitial = false;
  @observable submitting = false;
  @observable target = "";
  @observable loading = false;
  @observable.ref hubConnection: HubConnection | null = null;

  @action createHubConnection = (activityId: string) => {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl("http://localhost:5000/chat", {
        accessTokenFactory: () => this.rootStore.commonStore.token!,
      })
      .configureLogging(LogLevel.Information)
      .build();
    this.hubConnection!
      .start()
      .then(() => console.log(this.hubConnection!.state))
      .then(() =>{
        console.log('Attempting to join the group');
        this.hubConnection!.invoke('AddToGroup', activityId);
      })
      .catch((error) => console.log("Error establishing connection", error));

    this.hubConnection!.on("ReceiveComment", (comment) => {
      runInAction(() => {
        this.activity!.comments.push(comment);
      });
    });

    this.hubConnection!.on("Send", (message) => {
     toast.info(message);
    });


  };

  @action stopHubConnection = () => {
    this.hubConnection!.invoke('RemoveFromGroup', this.activity?.id)
    .then(() => {
      this.hubConnection!.stop();
    })
    .then(() => {
      console.log('Connection stopped');
    })
    .catch((error) => console.log(error));
    
  };

  @action addComment = async (values: any) => {
    values.activityId = this.activity!.id;
    console.log(this.activity)
    console.log(values)
    try {
      await this.hubConnection!.invoke("SendComment", values);
    } catch (error) {
      console.log(error);
    }
  };

  @computed get actvitiesByDate() {
    console.log(
      this.groupActivitiesByDate(Array.from(this.activityRegistry.values()))
    );
    return this.groupActivitiesByDate(
      Array.from(this.activityRegistry.values())
    );
  }

  groupActivitiesByDate(activities: IActivity[]) {
    const sortedActivities = activities.sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    return Object.entries(
      sortedActivities.reduce((activities, activity) => {
        const date = activity.date.toISOString().split("T")[0];
        activities[date] = activities[date]
          ? [...activities[date], activity]
          : [activity];
        return activities;
      }, {} as { [key: string]: IActivity[] })
    );
  }

  @action clearActivity = () => {
    this.activity = null;
  };

  @action loadActivities = async () => {
    this.loadingInitial = true;
    try {
      const activities = await agent.Activities.list();
      runInAction("loading activities", () => {
        activities.forEach((activity) => {
          setActivityProps(activity, this.rootStore.userStore.user!);
          this.activityRegistry.set(activity.id, activity);
        });
        this.loadingInitial = false;
      });
    } catch (error) {
      console.log(error);
      runInAction("error in loading activities", () => {
        this.loadingInitial = false;
      });
    }
  };

  @action loadActivity = async (id: string) => {
    let activity = this.getActivity(id);
    if (activity) {
      this.activity = activity;
      return activity;
    } else {
      this.loadingInitial = true;
      try {
        activity = await agent.Activities.delails(id);
        runInAction("getting activity", () => {
          setActivityProps(activity, this.rootStore.userStore.user!);
          this.activity = activity;
          this.activityRegistry.set(activity.id, activity);
          this.loadingInitial = false;
        });
        return activity;
      } catch (error) {
        runInAction("error in getting activity", () => {
          this.loadingInitial = false;
        });
        console.log(error);
      }
    }
  };

  getActivity = (id: string) => {
    return this.activityRegistry.get(id);
  };

  @action selectActivity = (id: string) => {
    this.activity = this.activityRegistry.get(id);
  };

  @action createActivity = async (activity: IActivity) => {
    this.submitting = true;
    try {
      await agent.Activities.create(activity);
      const attendee = createAttendee(this.rootStore.userStore.user!);
      attendee.isHost = true;
      let attendees = [];
      attendees.push(attendee);
      activity.attendees = attendees;
      activity.comments=[];
      activity.isHost = true;
      runInAction("creating activities", () => {
        this.activityRegistry.set(activity.id, activity);
        this.submitting = false;
      });
      history.push(`/activities/${activity.id}`);
    } catch (error) {
      console.log(error);
      runInAction("error in creating activities", () => {
        this.submitting = false;
      });
      toast.error("Problem submitting data");
    }
  };

  @action editActivity = async (activity: IActivity) => {
    this.submitting = true;
    try {
      await agent.Activities.update(activity);
      runInAction("editing activities", () => {
        this.activityRegistry.set(activity.id, activity);
        this.activity = activity;
        this.submitting = false;
      });
      history.push(`/activities/${activity.id}`);
    } catch (error) {
      console.log(error);
      runInAction("error in editing activities", () => {
        this.submitting = false;
      });
      toast.error("Problem submitting data");
    }
  };

  @action deleteActivity = async (
    event: SyntheticEvent<HTMLButtonElement>,
    id: string
  ) => {
    this.submitting = true;
    this.target = event.currentTarget.name;
    try {
      await agent.Activities.delete(id);
      runInAction("deleting activities", () => {
        this.activityRegistry.delete(id);
        this.target = "";
        this.submitting = false;
      });
    } catch (error) {
      console.log(error);
      runInAction("error in deleting activities", () => {
        this.target = "";
        this.submitting = false;
      });
    }
  };

  @action attendActivity = async () => {
    const attendee = createAttendee(this.rootStore.userStore.user!);
    this.loading = true;
    try {
      await agent.Activities.attent(this.activity!.id);
      runInAction(() => {
        if (this.activity) {
          this.activity.attendees.push(attendee);
          this.activity.isGoing = true;
          this.activityRegistry.set(this.activity.id, this.activity);
          this.loading = false;
        }
      });
    } catch (error) {
      runInAction(() => {
        this.loading = false;
        toast.error("Problem signing up with activity");
      });
    }
  };

  @action cancelAttendance = async () => {
    this.loading = true;
    try {
      await agent.Activities.unattent(this.activity!.id);
      runInAction(() => {
        if (this.activity) {
          this.activity.attendees = this.activity.attendees.filter(
            (a) => a.username !== this.rootStore.userStore.user!.username
          );

          this.activity.isGoing = false;
          this.activityRegistry.set(this.activity.id, this.activity);
          this.loading = false;
        }
      });
    } catch (error) {
      runInAction(() => {
        this.loading = false;
        toast.error("Problem cancelling attendance");
      });
    }
  };
}
