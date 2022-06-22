const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

	// used to run a record update test later
	let record_to_update = '';

	test( 'Create an issue with every field: POST request to /api/issues/{project}', (done) => {

		chai.request( server )
		.post( '/api/issues/apitest' )
		.send( {

			issue_title: 'Test Issue 1',
			issue_text: 'Test issue text description',
			created_by: "Mike",
			assigned_to: "Dave",
			status_text: "Investigating"
		} )
		.end( (err, res) => {

			assert.equal( res.status, 200 );
			assert.equal( res.type, 'application/json' );

			assert.equal( res.body.issue_title, 'Test Issue 1' );
			assert.equal( res.body.issue_text, 'Test issue text description' );
			assert.equal( res.body.created_by, 'Mike' );
			assert.equal( res.body.assigned_to, 'Dave' );
			assert.equal( res.body.open, true);
			assert.equal( res.body.status_text, 'Investigating' );
			assert.exists( res.body.created_on );
			assert.exists( res.body.updated_on );
			done();
		});
	});

	test( 'Create an issue with only required fields: POST request to /api/issues/{project}', (done) => {

		chai.request( server )
		.post( '/api/issues/apitest' )
		.send( {

			issue_title: 'Test Issue 2',
			issue_text: 'Test issue 2 text description',
			created_by: "Mike"
		} )
		.end( (err, res) => {

			assert.equal( res.status, 200 );
			assert.equal( res.type, 'application/json' );
			assert.equal( res.body.issue_title, 'Test Issue 2' );
			assert.equal( res.body.issue_text, 'Test issue 2 text description' );
			assert.equal( res.body.created_by, 'Mike' );
			assert.equal( res.body.assigned_to, '' );
			assert.equal( res.body.open, true);
			assert.equal( res.body.status_text, '' );
			assert.exists( res.body.created_on );
			assert.exists( res.body.updated_on );

			record_to_update = res.body._id;

			done();
		});
	});

	test( 'Create an issue with missing required fields: POST request to /api/issues/{project}', (done) => {

		chai.request( server )
		.post( '/api/issues/apitest' )
		.send( {

			issue_title: 'Test Issue 3',
			created_by: "Mike"
		} )
		.end( (err, res) => {

			assert.equal( res.status, 200 );
			assert.equal( res.type, 'application/json' );
			assert.equal( res.body.error, 'required field(s) missing' );
			done();
		});
	});

	test( 'View issues on a project: GET request to /api/issues/{project}', (done) => {

		chai.request( server )
		.get( '/api/issues/apitest' )
		.end( (err, res) => {

			assert.equal( res.status, 200 );
			assert.equal( res.type, 'application/json' );
			
      assert.isArray( res.body );
      assert.isAtLeast( res.body.length, 1 );
      
			res.body.forEach( (issue) => {

				assert.property( issue, 'issue_title' );
				assert.property( issue, 'issue_text' );
				assert.property( issue, 'created_on' );
				assert.property( issue, 'updated_on' );
				assert.property( issue, 'created_by' );
				assert.property( issue, 'assigned_to' );
				assert.property( issue, 'open' );
				assert.property( issue, 'status_text' );
			});

			done();
		});
	});

	test( 'View issues on a project with one filter: GET request to /api/issues/{project}', (done) => {

		chai.request( server )
		.get( '/api/issues/apitest?issue_title=Test%20Issue%202' )
		.end( (err, res) => {

			assert.equal( res.status, 200 );
			assert.equal( res.type, 'application/json' );

			assert.isArray( res.body );
      assert.isAtLeast( res.body.length, 1 );

			res.body.forEach( (issue) => {

				assert.property( issue, '_id' );
				assert.property( issue, 'issue_title' );
        assert.equal( issue.issue_title, 'Test Issue 2' );
				assert.property( issue, 'issue_text' );
				assert.property( issue, 'created_on' );
				assert.property( issue, 'updated_on' );
				assert.property( issue, 'created_by' );
				assert.property( issue, 'assigned_to' );
				assert.property( issue, 'open' );
				assert.property( issue, 'status_text' );
				assert.equal( issue.open, true );
			});

			done();
		});
	});

	test( 'View issues on a project with multiple filters: GET request to /api/issues/{project}', (done) => {

		chai.request( server )
		.get( '/api/issues/apitest?issue_title=Test%20Issue%202&created_by=Mike' )
		.end( (err, res) => {

			assert.equal( res.status, 200 );
			assert.equal( res.type, 'application/json' );
			assert.isArray( res.body );

			res.body.forEach( (issue) => {

				assert.property( issue, '_id' );
				assert.property( issue, 'issue_title' );
        assert.equal( issue.issue_title, 'Test Issue 2');
				assert.property( issue, 'issue_text' );
				assert.property( issue, 'created_on' );
				assert.property( issue, 'updated_on' );
				assert.property( issue, 'created_by' );
        assert.equal( issue.created_by, 'Mike' );
				assert.property( issue, 'assigned_to' );
				assert.property( issue, 'open' );
				assert.property( issue, 'status_text' );
			});

			done();
		});
	});

	test( 'Update one field on an issue: PUT request to /api/issues/{project}', (done) => {

		chai.request( server )
		.put( '/api/issues/apitest' )
		.send( {

			_id: record_to_update,
			assigned_to: "Dave"
		} )
		.end( (err, res) => {

			assert.equal( res.status, 200 );
			assert.equal( res.type, 'application/json' );
			assert.equal( res.body._id, record_to_update );
			assert.equal( res.body.result, 'successfully updated' );
			done();
		});
	});

	test( 'Update multiple fields on an issue: PUT request to /api/issues/{project}', (done) => {

		chai.request( server )
		.put( '/api/issues/apitest' )
		.send( {

			_id: record_to_update,
			issue_title: "Updated issue title",
			status_text: 'Assigned'
		} )
		.end( (err, res) => {

			assert.equal( res.status, 200 );
			assert.equal( res.type, 'application/json' );
			assert.equal( res.body._id, record_to_update );
			assert.equal( res.body.result, 'successfully updated' );
			done();
		});
	});

	test( 'Update an issue with missing _id: PUT request to /api/issues/{project}', (done) => {

		chai.request( server )
		.put( '/api/issues/apitest' )
		.send( {

			issue_title: "Re-updated issue title"
		} )
		.end( (err, res) => {

			assert.equal( res.status, 200 );
			assert.equal( res.type, 'application/json' );
			assert.equal( res.body.error, 'missing _id' );
			done();
		});
	});

	test( 'Update an issue with no fields to update: PUT request to /api/issues/{project}', (done) => {

		chai.request( server )
		.put( '/api/issues/apitest' )
		.send( {

			_id: record_to_update
		} )
		.end( (err, res) => {

			assert.equal( res.status, 200 );
			assert.equal( res.type, 'application/json' );
			assert.equal( res.body._id, record_to_update );
			assert.equal( res.body.error, 'no update field(s) sent' );
			done();
		});
	});

	test( 'Update an issue with an invalid _id: PUT request to /api/issues/{project}', (done) => {

		chai.request( server )
		.put( '/api/issues/apitest' )
		.send( {

			_id: '1',
      open: false
		} )
		.end( (err, res) => {

			assert.equal( res.status, 200 );
			assert.equal( res.type, 'application/json' );
			assert.equal( res.body._id, '1' );
			assert.equal( res.body.error, 'could not update' );
			done();
		});

	});

	test( 'Delete an issue: DELETE request to /api/issues/{project}', (done) => {

		chai.request( server )
		.delete( '/api/issues/apitest' )
		.send( {

			_id: record_to_update
		} )
		.end( (err, res) => {

			assert.equal( res.status, 200 );
			assert.equal( res.type, 'application/json' );
			assert.equal( res.body._id, record_to_update );
			assert.equal( res.body.result, 'successfully deleted' );
			done();
		});

	});

	test( 'Delete an issue with an invalid _id: DELETE request to /api/issues/{project}', (done) => {

		chai.request( server )
		.delete( '/api/issues/apitest' )
		.send( {

			_id: '1'
		} )
		.end( (err, res) => {

			assert.equal( res.status, 200 );
			assert.equal( res.type, 'application/json' );
			assert.equal( res.body._id, '1' );
			assert.equal( res.body.error, 'could not delete' );
			done();
		});

	});

	test( 'Delete an issue with missing _id: DELETE request to /api/issues/{project}', (done) => {

		chai.request( server )
		.delete( '/api/issues/apitest' )
		.send( {

			issue_title: 'Test Issue 1'
		} )
		.end( (err, res) => {

			assert.equal( res.status, 200 );
			assert.equal( res.type, 'application/json' );
			assert.equal( res.body.error, 'missing _id' );
			done();
		});
	});
});
