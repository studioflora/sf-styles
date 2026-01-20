console.log('reading sf-core');

class Sfignal {
	constructor(initialValue, validator = null) {
		this._value = initialValue;
		this._validator = validator;
		this._subscribers = new Set();
	}
 
	set state(newValue) {
		if (this._validator && !this._validator(newValue)) {
			// Validator failed
			console.log("custom validator failed");
			return;
		}
		
		if (this._value !== newValue) {
			this._value = newValue;
			this._sync();
		}

	}
 
	get state() {
		return this._value;
	}
 
	subscribe(callback) {
		this._subscribers.add(callback);
		return () => this._subscribers.delete(callback);
	}
 
	_sync() {
		this._subscribers.forEach(callback => callback(this._value));
	}
}
 
/* Usage
const myState = new Sfignal(0);
const unsubscribe = myState.subscribe(value => { console.log(value) }); or just
myState.subscribe(value => { console.log(value) });
myState.state = 1;
unsubscribe();
*/

function sfCreateElement(detailsObj) {
	const sfNewElement = document.createElement(detailsObj.type || 'div');
	if(detailsObj.class) { sfNewElement.classList.add(...detailsObj.class.split(' ')) }
	if(detailsObj.text) { sfNewElement.innerText = detailsObj.text }
	if(detailsObj.parent) { detailsObj.parent.appendChild(sfNewElement) }
	if(detailsObj.id) { sfNewElement.id = detailsObj.id }
	return sfNewElement;
}

let localDB;
let localSaves = {};
const localDBVersion = new Sfignal(0);
const localNow = new Date();

async function openLocalDB() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open('ProjectDB', 1);
		request.onupgradeneeded = (event) => {
			if (!event.target.result.objectStoreNames.contains('projects')) {
				event.target.result.createObjectStore('projects', { keyPath: 'name' });
			}
		};
		request.onsuccess = (event) => {
			localDB = event.target.result;
			resolve(localDBVersion);
		};
		request.onerror = (event) => {
			reject(event.target.error);
		};
	})
}

async function getLocalSaves() {
	return new Promise((resolve, reject) => {
		const transaction = localDB.transaction(['projects'], 'readonly');
		const store = transaction.objectStore('projects');
		const request = store.getAll();
		request.onsuccess = (event) => {
			event.target.result.forEach(project => {
				localSaves[project.name] = {
					name: project.name,
					...project.data
				};
			})
			localDBVersion.state++;
			resolve();
		};
		request.onerror = (event) => {
			reject(event.target.error) 
		};
	})
}

async function localSave(projectName, projectData) {
	return new Promise((resolve, reject) => {
		if (!localDB) {
			alert('Local saves not possible. Download anything you want to keep!');
			reject('Database not connected');
		}
		// projectData.metadata.lastEdit = Date.now();
		const transaction = localDB.transaction(['projects'], 'readwrite');
		const store = transaction.objectStore('projects');
		const putRequest = store.put({ 
			name: projectName, 
			data: projectData 
		});
		putRequest.onsuccess = () => {
			localSaves[projectName] = structuredClone(projectData);
			localDBVersion.state++;
			resolve();
		};
		putRequest.onerror = (event) => {
			alert('Error saving project. Please try again.');
			reject(event.target.error);
		};
	})
}

async function localDelete(projectName) {
	return new Promise((resolve, reject) => {
		const transaction = localDB.transaction(['projects'], 'readwrite');
		const store = transaction.objectStore('projects');
		const request = store.delete(projectName);
	
		request.onsuccess = () => {
			delete localSaves[projectName];
			localDBVersion.state++;
			resolve();
		};
		
		request.onerror = () => {
			reject(`Error deleting project "${projectName}"`);
		};
	})
}