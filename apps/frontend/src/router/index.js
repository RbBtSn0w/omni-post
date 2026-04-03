import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import AccountManagement from '../views/AccountManagement.vue'
import MaterialManagement from '../views/MaterialManagement.vue'
import PublishCenter from '../views/PublishCenter.vue'
import CapabilityPublishWizard from '../views/CapabilityPublishWizard.vue'
import ArticlePublish from '../views/ArticlePublish.vue'
import TaskManagement from '../views/TaskManagement.vue'
import About from '../views/About.vue'
import Extensions from '../views/Extensions.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/account-management',
    name: 'AccountManagement',
    component: AccountManagement
  },
  {
    path: '/video-resource-management',
    name: 'VideoResourceManagement',
    component: MaterialManagement
  },
  {
    path: '/publish-center',
    name: 'PublishCenter',
    component: PublishCenter
  },
  {
    path: '/publish-wizard',
    name: 'PublishWizard',
    component: CapabilityPublishWizard
  },
  {
    path: '/article-publish',
    name: 'ArticlePublish',
    component: ArticlePublish
  },
  {
    path: '/task-management',
    name: 'TaskManagement',
    component: TaskManagement
  },
  {
    path: '/task-management/:id',
    name: 'TaskDetail',
    component: TaskManagement
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/extension',
    name: 'Extensions',
    component: Extensions
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
