const defaultUserAddIns = require('json-on-relations').DefaultUserAddIns;
const path = require('path');
const Message = require('ui-message').Message;
const MsgFileStore = require('ui-message').MsgFileStore;
const msgStore = new MsgFileStore(path.join(__dirname, '../../data/message.json'));
const message = new Message(msgStore, 'EN');

defaultUserAddIns.beforeEntityQuery.use('*', checkQueryPermission);
defaultUserAddIns.afterEntityReading.use('*', checkReadPermission);

function checkQueryPermission(req, callback) {
  if(!req.user.Authorization.check('ENTITY',
    {ENTITY_ID: req.body['ENTITY_ID'], RELATION_ID: req.body['RELATION_ID'], ACTION: 'READ'}))
  {
    callback([message.reportShortText('PERMISSION', 'QUERY_PERMISSION', 'E',
      req.body['ENTITY_ID'], req.body['RELATION_ID'])]);
  } else {
    callback(null);
  }
}

function checkReadPermission(req, callback) {
  if(!req.user.Authorization.check('ENTITY',
    {ENTITY_ID: req.body['ENTITY_ID'], RELATION_ID: '*', ACTION: 'READ'}))
  {
    callback([message.reportShortText('PERMISSION', 'READ_PERMISSION', 'E',
      req.body['ENTITY_ID'])]);
  } else {
    callback(null, req.body);
  }
}

