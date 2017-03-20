// Define a new component called todo-item
Vue.component( 'message', {
	props: ['message'],
	template: '<div v-bind:class="{ pending: isPending }">[{{ message.time.toLocaleString() }}] &lt;{{ message.author }}&gt;: {{ message.text }}</div>',
	computed: {
		isPending: function () {
			return !this.message.id;
		}
	}
} );

var state = {
	messages: [],
	messagesToSend: [],
	sending: false,
	addMessage: function ( message ) {
		this.addMessages( [message] );
	},
	addMessages: function ( messages ) {
		var self = this;
		messages.forEach( function ( m ) {
			self.messages.push( m );
		} );
		var ms = [];
		this.messages.forEach( function ( m ) {
			ms.push( m );
		} );

		this.messages = ms;
		// XXX Don't like. Objects are the same (by value) but (it seems like) DOM is being rebuilt

		if ( messages.length > 0 ) {// XXX Problem with sorting - jumping scroll
			this._sort();
		}
	},
	_sort: function () {
		this.messages.sort( function ( a, b ) {
			function myXOR( a, b ) {
				return ( a || b ) && !( a && b );
			}

			if ( myXOR( a.id === null, b.id === null ) ) {
				return -(Number( a.id ) - Number( b.id ));
			}
			var diff = a.time.getTime() - b.time.getTime();
			if ( diff === 0 ) {
				return a.id - b.id;
			}
			return diff;
		} );
		//
		// var ms = [];
		// this.messages.forEach( function ( m ) {
		// 	ms.push( m );
		// } );
		//
		// this.messages = ms;
	}
};

var store = new Vuex.Store( {
	state: state,
	strict: true,
	mutations: {
		addMessage: function ( state, message ) {
			state.addMessage( message );
		},
		addMissingMessages: function ( state, messages ) {
			var messagesToAdd = messages.filter( function ( messageToFind ) {
				return !state.messages.find( function ( m ) {
					return m.id === messageToFind.id;
				} );
			} );

			state.addMessages( messagesToAdd );
		},
		updateMessage: function ( state, object ) {
			object.message.id = object.id;
			object.message.time = object.time;
			state._sort();
		},
		removeMessage: function ( state, message ) {
			var indexOf = state.messages.indexOf( message );
			if ( indexOf > -1 ) {
				state.messages.splice( indexOf, 1 );
			}
		},
		queueMessage: function ( state, message ) {
			state.messagesToSend.push( message );
		},
		clearQueue: function ( state, message ) {
			state.messagesToSend = [];
		},
		startSending: function ( state ) {
			state.sending = true;
		},
		stopSending: function ( state ) {
			state.sending = false;
		}
	},
	actions: {
		addMessage: function ( context, message ) {
			context.commit( 'addMessage', message );
			context.commit( 'queueMessage', message );
			context.dispatch( 'sendMessages' )
		},
		sendMessages: function ( context ) {
			if ( context.state.messagesToSend.length === 0 || context.state.sending ) {
				return;
			}

			context.commit( 'startSending' );
			var messagesToSend = context.state.messagesToSend;
			context.commit( 'clearQueue' );

			rehttp.request( {
				url: '/addMessage.php',
				method: 'POST',
				body: JSON.stringify( messagesToSend )
			} ).then( function ( response ) {
				if ( response.status === 200 ) {
					var newMessages = JSON.parse( response.body );
					newMessages.forEach( function ( newMessage, index ) {
						var message = messagesToSend[index];
						context.commit(
							'updateMessage',
							{message: message, id: newMessage.id, time: new Date( newMessage.time )}
						);
					} );
					context.commit( 'stopSending' );
					context.dispatch( 'sendMessages' );
				} else {
					messagesToSend.forEach( function ( message, index ) {
						context.commit( 'queueMessage', message );
					} );
					context.commit( 'stopSending' );
				}
			} ).catch( function () {
				context.commit( 'stopSending' );
			} );
		},
		initMessages: function ( context ) {
			rehttp.request( {url: '/messages.json'} )
				.then( function ( response ) {
					var messages = JSON.parse( response.body );
					messages.forEach( function ( m ) {
						m.time = new Date( m.time );
					} );

					var messagesToAdd = messages.filter( function ( messageToFind ) {
						return !state.messages.find( function ( m ) {
							return m.id === messageToFind.id;
						} );
					} );
					if ( messagesToAdd.length > 0 ) {
						context.commit( 'addMissingMessages', messagesToAdd );
					}
				} );
		}
	}
} );

var app = new Vue( {
	el: '#app',
	store: store,
	data: {
		author: '',
		currentMessageInput: ''
	},
	created: function () {
		this.$store.dispatch( 'initMessages' );
		this.author = window.prompt( "Enter your name", 'no name' );
		var self = this;
		setInterval( function () {
			self.$store.dispatch( 'initMessages' );
		}, 1000 );
	},
	computed: {
		hasMessagesInQueueAndNotSending:function () {
			return this.$store.state.messagesToSend.length > 0 && !this.$store.state.sending;
		},
		messages: function () {
			return this.$store.state.messages;
		},
		currentMessage: function () {
			return this.currentMessageInput.trim()
		}
	},
	methods: {
		addMessage: function () {
			if ( this.currentMessage === '' ) {
				return;
			}

			var message = {
				id: null,
				time: new Date(),
				author: this.author,
				text: this.currentMessage
			};
			this.$store.dispatch( 'addMessage', message );
			this.currentMessageInput = '';
		},
		resend: function () {
			this.$store.dispatch( 'sendMessages');
		}
	},
	updated: function () {
		var container = this.$el.querySelector( ".messages" );
		container.scrollTop = container.scrollHeight;
	}
} );
