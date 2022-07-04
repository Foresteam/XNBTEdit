import { defineStore } from "pinia";

interface State {
	isEditing: boolean;
}
export const useMain = defineStore('main', {
	state: (): State => ({
		isEditing: false
	})
});