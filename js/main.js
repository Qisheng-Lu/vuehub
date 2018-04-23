'use strict';

Vue.component('repo-list', {
  data: function() {
	return {
	  auth: {
		complete: false,
		attempting: false,
		failed: false,
	  },
	  api: undefined,
	  repos: [],
	  updating: false,
	  loaded_all: false,
	  unknown_fail: undefined,
	};
  },
  directives: {
	focus: {
	  inserted: (el) => el.focus(),
	},
  },
  methods: {
	auth_attempt: function(event) {
	  this.auth.attempting = true;
	  let user_input = event.target.children[0];
	  let pass_input = event.target.children[1];
	  this.api = new RepoList(
		user_input.value,
		pass_input.value,
		{per_page: 4, params: {
		  sort: 'updated',
		}},
	  );

	  this.api.check_auth().then(() => {
		this.auth.complete = true;
		this.update_repos();
	  }).catch((err) => {
		if (err.response.status === 401)
		  this.auth.failed = true;
		else {
		  this.unknown_fail = err;
		  console.log('error: ' + err);
		}
	  }).finally(() => {
		this.auth.attempting = false;
	  });

	},
	update_repos: async function() {
	  this.repos = [];
	  this.updating = true;
	  this.loaded_all = false;

	  // get a page and push all repos
	  for await (let page of this.api) {
		for (let repo of page) {
		  this.repos.push({
			name: repo.name,
			full_name: repo.full_name,
			clone_url: repo.clone_url,
		  });
		}
		this.updating = false;
		await at_bottom();
		this.updating = true;
	  }
	  this.updating = false;
	  this.loaded_all = true;
	},
  },
  template: `
  <div>
	<header class="navbar p-2">
	  <p class="navbar-brand">VueHub</p>
	</header>

	<div class="modal active" v-if="!auth.complete">
	  <div class="modal-container">
		<div v-if="!auth.attempting" class="modal-body">
		  <form v-on:submit.prevent="auth_attempt" class="columns">
			<input type="text"
				   placeholder="username"
				   class="form-input col-5"
				   v-focus
				   v-bind:class="{'is-error': auth.failed}">
			<input type="password"
				   placeholder="password"
				   class="form-input col-5"
				   v-bind:class="{'is-error': auth.failed}">
			<input type="submit"
				   value="submit"
				   class="form-input col-2">
		  </form>
		</div>
		<div v-else class="modal-body">
		  <div class="loading"></div>
		</div>
	  </div>
	</div>

	<div v-else>
	  <div v-if="updating" class="toast cornered">
		loading more...
	  </div>
	  <div v-if="loaded_all" class="toast cornered">
		all loaded up
	  </div>

	  <div v-if="!updating"
			  v-on:click="update_repos" 
			  class="btn toast cornered">
			  refresh
	  </div>

	  <table class="table table-striped table-hover">
		<tbody v-for="repo in repos">
		  <tr>
			<td>{{ repo.name }}</td>
			<td>{{ repo.full_name }}</td>
			<td>
			  <a v-bind:href="repo.clone_url">view on github</a>
			</td>
		  </tr>
		</tbody>
	  </table>
	</div>
  </div>
  `,
});

let app = new Vue({
  el: '#mount',
});
