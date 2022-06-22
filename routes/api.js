'use strict';

const bodyParser  = require('body-parser');

// database
const mongoose = require( 'mongoose' );
const { Schema } = mongoose;

// define the data schema
const issueSchema = new Schema({

	project: String,
	issues: [ {

		issue_title: String,
		issue_text: String,
		created_on: String,
		updated_on: String,
		created_by: String,
		assigned_to: String,
		open: Boolean,
		status_text: String
	} ]
});

// create a model from the schema
const issueModel = mongoose.model( 'issue', issueSchema );

// connect to the database
mongoose.connect( process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false } );


module.exports = function(app) {

  app.route( '/api/issues/:project', bodyParser.urlencoded( { extended: false } ) );
  
	app.route( '/api/issues/:project' )

  .get(function (req, res) {
    
    // get all issues for the given project
    issueModel.find( { project: req.params.project }, (err, data) => {

      // filter results
      let results = data[0].issues.filter( (el) => {
        
        if ( req.query._id         && el._id.toString() != req.query._id ) { return }
        if ( req.query.issue_title && el.issue_title != req.query.issue_title ) { return }
        if ( req.query.issue_text  && el.issue_text  != req.query.issue_text  ) { return }
        if ( req.query.created_on  && el.created_on  != req.query.created_on  ) { return }
        if ( req.query.updated_on  && el.updated_on  != req.query.updated_on  ) { return }
        if ( req.query.created_by  && el.created_by  != req.query.created_by  ) { return }
        if ( req.query.assigned_to && el.assigned_to != req.query.assigned_to ) { return }
        if ( req.query.status_text && el.status_text != req.query.status_text ) { return }
        
        // convert the req.query.open value to boolean from string to compare
        if ( req.query.open && el.open != JSON.parse(req.query.open.toLowerCase()) ) { return }
        
        return el;
      });
      
      // return results
      res.json( results );
    });
  })

  .post(function (req, res) {

    // add a new issue to the database

    // check for required fields
    if ( !req.body.hasOwnProperty( 'issue_title' ) ||
         !req.body.hasOwnProperty( 'issue_text' ) ||
         !req.body.hasOwnProperty( 'created_by' )
    ) {

      res.json( { error: 'required field(s) missing' } );
    }
    else {

      const formattedDate = ( new Date( Date.now() ) ).toISOString();

      const record = {

        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_by: req.body.created_by,
        assigned_to: req.body.assigned_to || '',
        status_text: req.body.status_text || '',
        open: true,
        created_on: formattedDate,
        updated_on: formattedDate
      };

      // search for an existing project name and add it to the database before trying to update it's issues record
      issueModel.find( { project: req.params.project }, ( err, results ) => {

          issueModel.findOneAndUpdate( { project: req.params.project },
            { $set: { project: req.params.project }, $push: { issues: record } }, { new: true, upsert: true }, ( err, data ) => {
            
            // get the _id for the newly inserted object
            let _id = data.issues[ data.issues.length - 1 ]._id;

            // add _id to record
            record._id = _id;
            
            res.json( record );
          });

      });
    }
  })

  .put(function (req, res) {

    let project = req.params.project;
    
    // check if an _id was provided
    if ( req.body._id === undefined ) { res.json( { error: 'missing _id' } ); return; }

    // check for update fields
    if ( req.body.issue_title === undefined &&
         req.body.issue_text  === undefined &&
         req.body.created_by  === undefined &&
         req.body.assigned_to === undefined &&
         req.body.status_text === undefined &&
         req.body.created_on  === undefined &&
         req.body.updated_on  === undefined &&
         req.body.open        === undefined ) { 
    
      res.json( { _id: req.body._id, error: 'no update field(s) sent' } );
      return;
    }
    
    // get the issue array from the relevant project
    issueModel.find( { project: req.params.project }, ( err, data ) => {

      // find the record with the matching _id
      let results = data[0].issues.filter( (el) => {
        
        return ( el._id == req.body._id ) ? el : null;
      });
    
      if ( results.length == 0 || results.length > 1 ) {
      
        res.json( { _id: req.body._id, error: 'could not update' } );
        return;
      }
      else {
        
        // update the records
        let update = data[0].issues.filter( (el) => {
          
          if ( el._id == req.body._id ) {
            
            if ( req.body.issue_title !== undefined && req.body.issue_title != '' ) { el.issue_title = req.body.issue_title; }
            if ( req.body.issue_text  !== undefined && req.body.issue_text  != '' ) { el.issue_text  = req.body.issue_text;  }
            if ( req.body.created_by  !== undefined && req.body.created_by  != '' ) { el.created_by  = req.body.created_by;  }
            if ( req.body.assigned_to !== undefined && req.body.assigned_to != '' ) { el.assigned_to = req.body.assigned_to; }
            if ( req.body.status_text !== undefined && req.body.status_text != '' ) { el.status_text = req.body.status_text; }
            if ( req.body.open        !== undefined && req.body.open        != '' ) { el.open        = req.body.open;        }
            
            el.updated_on = ( new Date( Date.now() ) ).toISOString();
          }
          
          return el;
        });
        
        issueModel.findOneAndUpdate( { project: req.params.project },
            { $set: { issues: update } }, { new: true }, ( err, data ) => {
          
          res.json( { result: 'successfully updated', _id: req.body._id } );
          return;
        });
      }
    });
  })

  .delete(function (req, res) {

    // check if an _id was provided
    if ( req.body._id === undefined ) { res.json( { error: 'missing _id' } ); return; }

    // get all issues for the given project
    issueModel.find( { project: req.params.project }, (err, data) => {

      // filter out all issues not matching the _id to delete
      let updated_issues = data[0].issues.filter( (el) => {

        return ( el._id != req.body._id ) ? el : null;
      });

      if ( updated_issues.length == data[0].issues.length ) {
        
        // no issues were removed
        res.json( { _id: req.body._id, error: 'could not delete' } );
        return;
      }
      else {

        // update the given record with the new issues array
        issueModel.findOneAndUpdate( { project: req.params.project },
            { issues: updated_issues }, { new: true }, ( err, data ) => {
        
          res.json( { _id: req.body._id, result: 'successfully deleted' } );
          return;
        });
      }
    });    
  });
};
