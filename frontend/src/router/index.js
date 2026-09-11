import { createRouter, createWebHistory } from 'vue-router'

import MainLayout from '../layouts/MainLayout.vue'
import Home from '../views/Home.vue'
import Profiles from '../views/Profiles.vue'
import Items from '../views/Items.vue'
import Timeline from '../views/Timeline.vue'
import Inventory from '../views/Inventory.vue'
import TestLayout from '../layouts/TestLayout.vue'
import Categories from '../components/Categories.vue'
import Calendar from '../components/Calendar.vue'
import Collection from '../components/Collection.vue'
import Finance from '../components/Finance.vue'
import FinanceMockAssets from '../views/FinanceMockAssets.vue'
import FinancePortfolio from '../views/FinancePortfolio.vue'
import FinanceSavings from '../views/FinanceSavings.vue'
import GrowthLayout from '../views/growth/GrowthLayout.vue'
import GrowthGoals from '../views/growth/GrowthGoals.vue'
import GrowthWellbeing from '../views/growth/GrowthWellbeing.vue'
import GrowthSleep from '../views/growth/GrowthSleep.vue'
import GrowthHealth from '../views/growth/GrowthHealth.vue'
import Persona from '../components/Persona.vue'
import Product from '../components/Product.vue'
import Test from '../layouts/TwoColumnLayout.vue'
import TestPo from '../layouts/TwoColumnLayout.vue'
import TwoColumnLayout from '../layouts/TwoColumnLayout.vue'
import PersonaOverview from '../components/PersonaOverview.vue'
import GroupOverview from '../components/GroupOverview.vue'
import Wardrobe from '../components/wardrobe.vue'
import AccountSettings from '../views/AccountSettings.vue'
import AccountModelAssistant from '../views/AccountModelAssistant.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
        {
            path: '/home',
            name: 'Home',
            component: Home,
            meta: {
                layout: 'default'
            }
        },
        {
            path: '/souls',
            redirect: '/souls/prims',
        },
        {
            path: '/souls/prims',
            name: 'SoulsPrims',
            component: Persona,
            meta: { layout: 'default' },
        },
        {
            path: '/souls/prims/:id',
            name: 'PrimOverview',
            component: PersonaOverview,
            props: (route) => ({ id: route.params.id }),
            meta: { layout: 'default' },
        },
        {
            path: '/souls/animals',
            name: 'SoulsAnimals',
            component: () => import('../views/SoulsAnimals.vue'),
            meta: { layout: 'default' },
        },
        {
            path: '/personas',
            redirect: '/souls/prims',
        },
        {
            path: '/personas/:id',
            redirect: (to) => ({ path: `/souls/prims/${to.params.id}` }),
        },

        {
            path: '/calendar',
            name: 'Calendar',
            component: Timeline,
            meta: {
                layout: 'default'
            }
        },
        {
            path: '/timeline',
            redirect: '/calendar',
        },
        {
            path: '/items',
            name: 'Items',
            component: Items,
            meta: {
                layout: 'default'
            }
        },
        {
            path: '/test',
            name: 'Test',
            component: TestLayout,
            meta: {
                layout: 'default'
            }        
        },
        {
            path: '/collection',
            // component: Collection,    
            children: [
                {
                    path: '',
                    name: 'collection',
                    component: Collection,                    
                },
                {
                    path: 'all',
                    name: 'collection-all',
                    component: TwoColumnLayout,
                    props: () => ({
                        name: 'all',
                        groupId: null,
                    }),
                },
                {
                    path: 'c/:name',
                    name: 'collection-category',
                    component: TwoColumnLayout,
                    props: route => ({
                        name: route.params.name,
                        groupId: route.query.groupId,
                    }),
                },
                {
                    path: 'c/:name/item/:item_name',
                    name: 'item-overview',
                    component: Product,
                    props: route => ({
                        name: route.params.name,
                        item_name: route.params.item_name,
                        groupId: route.query.groupId,
                    }),
                }
            ],
            meta: {
                layout: 'default'
            },        
        },
        {
            path: '/finance',
            children: [
                {
                    path: '',
                    name: 'Finance',
                    component: Finance,
                },
                {
                    path: 'portfolio',
                    name: 'FinancePortfolio',
                    component: FinancePortfolio,
                },
                {
                    path: 'savings',
                    name: 'FinanceSavings',
                    component: FinanceSavings,
                },
                {
                    path: 'demo-assets',
                    name: 'FinanceMockAssets',
                    component: FinanceMockAssets,
                },
                {
                    path: ':grouplink',
                    name: 'FinanceDetials',
                    component: GroupOverview,
                    props: true,
                },
            ],
            meta: {
                layout: 'inventory'
            }        
        },
        {
            path: '/growth',
            component: GrowthLayout,
            meta: { layout: 'default' },
            children: [
                { path: '', redirect: { name: 'GrowthGoals' } },
                { path: 'goals', name: 'GrowthGoals', component: GrowthGoals },
                { path: 'wellbeing', name: 'GrowthWellbeing', component: GrowthWellbeing },
                { path: 'sleep', name: 'GrowthSleep', component: GrowthSleep },
                { path: 'health', name: 'GrowthHealth', component: GrowthHealth },
            ],
        },
        {
            path: '/account',
            name: 'AccountSettings',
            component: AccountSettings,
            meta: { layout: 'default' },
        },
        {
            path: '/account/backend',
            name: 'AccountBackend',
            component: AccountModelAssistant,
            meta: { layout: 'default' },
        },
        { path: '/account/model-assistant', redirect: '/account/backend' },
        {
            path: '/cal',
            name: 'Collectiona',
            component: TestLayout,
            meta: {
                layout: 'default'
            },
        },
        {
            path: '/xxx',
            name: 'Collectiona',
            component: TwoColumnLayout,
            meta: {
                layout: 'default'
            },
        },
        {
            path: '/c',
            name: 'Wardrobe',
            component: Wardrobe,
            meta: {
                layout: 'default'
            },
        }      
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router