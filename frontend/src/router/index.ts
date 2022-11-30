import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "../views/home/HomeView.vue";
import PipelineIndex from "../views/pipeline/index/index.vue";
import Process from "../views/pipeline/process/index.vue";
import Stage from "../views/pipeline/stage/index.vue";
import Create from "../views/pipeline/create/index.vue";
import Edit from "../views/pipeline/edit/index.vue";
import AllLogs from "../views/pipeline/allLogs/index.vue";
import CreatePipeline from "../views/pipeline/create/config/index.vue";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/home",
      name: "home",
      component: HomeView,
    },
    {
      path: "/",
      redirect: "/pipeline",
    },
    {
      path: "/pipeline",
      name: "Pipeline",
      component: PipelineIndex,
    },
    {
      path: "/pipeline/:name",
      name: "stage",
      component: Stage,
    },
    {
      path: "/pipeline/:name/:id",
      name: "Process",
      component: Process,
      meta:{
        breadcrumbName: '',
      }
    },
    {
      path: "/allLogs/:name/:id",
      name: "AllLogs",
      component: AllLogs,
      meta: {
        title: "全部日志",
        layout: "null",
      },
    },
    {
      path: "/create",
      name: "create",
      component: Create,
    },
    {
      path: "/create/config/:id",
      name: "CreateConfig",
      component: CreatePipeline,
    },
    {
      path: "/edit/:id",
      name: "Edit",
      component: Edit,
    },
  ],
});

export default router;
