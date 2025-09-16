import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { AddContentPage } from './pages/add-content-page/add-content-page';

export const routes: Routes = [
    {
        path: '',
        component: HomePage
    },
    {
        path: 'add-content',
        component: AddContentPage
    }
];
