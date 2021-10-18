const express = require('express')
const multer = require('multer')
const fs = require('fs');
const path = require('path');
const mime = require('mime-types')

const app = express();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function (req, res) {
  res.send('GO!')
});


// Fetch the actual file
app.get('/:layer/:fid/attachments/:id', function (req, res, next) {
  const dir = path.join(__dirname, 'stash', req.params.layer, req.params.fid);
  const attribs = fs.readdirSync(dir);
  //TODO: switch place between attrib and id to speed things up
  attribs.forEach(attrib => {
    const attribPath = path.join(dir, attrib);
    ids = fs.readdirSync(attribPath);
    ids.forEach(id => {
      if (id == req.params.id) {
        const idPath = path.join(attribPath, id);
        file = fs.readdirSync(idPath)[0];
        const fullPath = path.join(idPath, file);
        res.sendFile(fullPath);
      }
    });
  });
});

// Deletes an attachment
app.post('/:layer/:fid/deleteAttachments/', express.urlencoded({ extended: true }), function (req, res, next) {
  const idsToDelete = req.body.attachmentIds.split(',');
  const dir = path.join(__dirname, 'stash', req.params.layer, req.params.fid);
  const attribs = fs.readdirSync(dir);
  const result = { "deleteAttachmentResults": [] };
  //TODO: switch place between attrib and id to speed things up
  idsToDelete.forEach(idToDelete => {
    attribs.forEach(attrib => {
      const attribPath = path.join(dir, attrib);
      const ids = fs.readdirSync(attribPath);
      ids.forEach(id => {
        if (id == idToDelete) {
          const idPath = path.join(attribPath, id);
          fs.rmdirSync(idPath, { recursive: true });
          result.deleteAttachmentResults.push({
            "objectId": idToDelete,
            "globalId": null,
            "success": true
          });
        }
      });
    });
  });
  res.json(result);
});

// Get a list of attachemntInfos
app.get('/:layer/:fid/attachments/', function (req, res, next) {
  const dir = path.join(__dirname, 'stash', req.params.layer, req.params.fid);
  let infos = [];
  if (!fs.existsSync(dir)) {
    res.json({ "attachmentInfos": infos });
  } else {

    const attribs = fs.readdirSync(dir);
    //TODO: switch place between attrib and id to make it easiser to create ids
    attribs.forEach(attrib => {
      const attribPath = path.join(dir, attrib);
      ids = fs.readdirSync(attribPath);
      ids.forEach(id => {
        const idPath = path.join(attribPath, id);
        file = fs.readdirSync(idPath)[0];
        const fullPath = path.join(idPath, file);
        const fileInfo = {
          "id": id,
          "contentType": mime.lookup(file),
          "size": fs.statSync(fullPath).size,
          "name": file,
          "group": attrib
        };
        infos.push(fileInfo);
      });
    });
    res.json({ "attachmentInfos": infos });
  }

});

// Uploads a new attachment
app.post('/:layer/:fid/addAttachment', upload.single('attachment'), function (req, res, next) {
  console.log(req.body);

  // Pick out the group this attachment belong to.
  const attrib = req.body.group;
  let dir = path.join(__dirname, 'stash', req.params.layer, req.params.fid);
  let maxId = 0;

  // Find which id to use. Simple alorithm that takes the highest id + 1. Will reuse ids if highest is deleted
  if (fs.existsSync(dir)) {
    const attribs = fs.readdirSync(dir);
    attribs.forEach(currAttrib => {
      const attribPath = path.join(dir, currAttrib);
      ids = fs.readdirSync(attribPath);
      ids.forEach(id => {
        if (id > maxId) {
          maxId = Number(id);
        }
      });
    });

  } 

  //TODO: switch place between attrib and id to speed things up

  
  const newId = maxId + 1;

  dir = path.join(dir, attrib);

  dir = path.join(dir, newId.toString());
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const fileName = path.join(dir, req.file.originalname);
  fs.writeFileSync(fileName, req.file.buffer);
  const retval = {
    "addAttachmentResult": {
      "objectId": newId,
      "globalId": null,
      "success": true
    }
  }
  
  res.json(retval);
});

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});