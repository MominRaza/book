import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./pages/startup').then((m) => m.Startup),
		title: 'Book - Startup',
	},
	{
		path: 'setup',
		loadComponent: () => import('./pages/setup').then((m) => m.Setup),
		title: 'Book - Setup',
	},
	{
		path: 'library',
		loadComponent: () => import('./pages/library').then((m) => m.Library),
		title: 'Book - Library',
	},
	{
		path: '**',
		redirectTo: '',
	},
];
