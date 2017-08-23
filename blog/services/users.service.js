"use strict";

const path = require("path");
const _ = require("lodash");
const bcrypt = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const DbService = require("moleculer-db");
const MongooseAdapter = require("moleculer-db-adapter-mongoose");
const User = require("../models/user.model");
const Fakerator = require("fakerator");
const fake = new Fakerator();

function hashPassword(password) {
	return new Promise((resolve, reject) => {
		bcrypt.genSalt(10, function (error, salt) {
			if (error) {
				return reject(error);
			}

			bcrypt.hash(password, salt, function (error, hashedPassword) {
				if (error) {
					return reject(error);
				}

				resolve(hashedPassword);
			});
		});
	});
}

module.exports = {
	name: "users",
	mixins: [DbService],
	adapter: new MongooseAdapter(process.env.MONGO_URI || "mongodb://localhost/moleculer-blog"),
	model: User,

	settings: {
		fields: ["_id", "username", "fullName", "email", "avatar", "author"]
	},

	actions: {
		authors: {
			cache: true,
			handler(ctx) {
				return this.find(ctx, { query: { author: true }});
			}
		}
	},

	methods: {
		seedDB() {
			this.logger.info("Seed Users DB...");
			// Create authors
			return Promise.resolve()
				.then(() => this.create(null, {
					username: "john",
					password: "john1234",
					fullName: "John Doe",
					email: "john.doe@blog.moleculer.services",
					avatar: fake.internet.avatar(),
					author: true,
				}))
				.then(() => this.create(null, {
					username: "jane",
					password: "jane1234",
					fullName: "Jane Doe",
					email: "jane.doe@blog.moleculer.services",
					avatar: fake.internet.avatar(),
					author: true
				}))

				// Create fake commenter users
				.then(() => this.createMany(null, _.times(30, () => {
					let fakeUser = fake.entity.user();
					return {
						username: fakeUser.userName,
						password: fakeUser.password,
						fullName: fakeUser.firstName + " " + fakeUser.lastName,
						email: fakeUser.email,
						avatar: fakeUser.avatar,
						author: false
					};
				})))
				.then(users => console.log(`Generated ${users.length} users!`));
		}
	},

	afterConnected() {
		return this.count().then(count => {
			if (count == 0) {
				this.seedDB();
			}
		});
	}

};
