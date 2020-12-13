var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

var NodeGeocoder = require('node-geocoder');

var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};

var geocoder = NodeGeocoder(options);

//Campgrounds Landing Page
router.get('/', function(req, res) {
  var noMatch = null;
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    Campground.find({
      name: regex
    }, function(err, allcampground) {
      if (err) {
        console.log(err);
      } else {
        if (allcampground.length < 1) {
          noMatch = "No Campgrounds with this search";
        }
        console.log("Campgrounds");
        res.render('campgrounds/index', {
          campgrounds: allcampground,
          page: 'campgrounds',
          noMatch: noMatch
        });
      }
    });
  } else {
    Campground.find({}, function(err, allcampground) {
      if (err) {
        console.log(err);
      } else {
        console.log("Campgrounds");
        res.render('campgrounds/index', {
          campgrounds: allcampground,
          page: 'campgrounds',
          noMatch: noMatch
        });
      }
    });
  }
});


//Campgrounds Post
router.post("/", middleware.isLoggedIn, function(req, res) {
  // get data from form and add to campgrounds array
  var name = req.body.name;
  var price = req.body.price;
  var image = req.body.image;
  var desc = req.body.description;
  var author = {
    id: req.user._id,
    username: req.user.username
  };
  geocoder.geocode(req.body.location, function(err, data) {
    if (err || !data.length) {
      console.log(err.message);
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var newCampground = {
      name: name,
      price: price,
      image: image,
      description: desc,
      author: author,
      location: location,
      lat: lat,
      lng: lng
    };
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated) {
      if (err) {
        console.log(err.message);
      } else {
        //redirect back to campgrounds page
        console.log(newlyCreated);
        res.redirect("/campgrounds");
      }
    });
  });
});


// router.post("/", middleware.isLoggedIn, function(req, res) {
//   var name = req.body.name;
//   var price = req.body.price;
//   var image = req.body.image;
//   var desc = req.body.description;
//   var author = {
//     id: req.user._id,
//     username: req.user.username
//   };
//   var newCampground = {
//     name: name,
//     price: price,
//     image: image,
//     description: desc,
//     author: author
//   };
//   Campground.create(newCampground, function(err, allnewcampground) {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log(allnewcampground);
//       res.redirect("/campgrounds");
//     }
//   });
//   // campgrounds.push(newCampground);
//   // res.redirect("/campgrounds");
// })


//Campgrounds New Addition Link
router.get("/new", middleware.isLoggedIn, function(req, res) {
  res.render("campgrounds/new");
});

//Campgrounds Specific ID
router.get("/:id", function(req, res) {
  Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground) {
    //Campground.findById(req.params.id, function (err, foundCampground) {
    if (err) {
      console.log(err);
    } else {
      //console.log(foundCampground);
      res.render("campgrounds/show", {
        campground: foundCampground
      });
    }
  });
});


//Edit Campground
router.get("/:id/edit", middleware.checkOwner, function(req, res) {
  Campground.findById(req.params.id, function(err, foundCampground) {
    res.render("campgrounds/edit", {
      campground: foundCampground
    });
  });
});


//Update Campground
router.put("/:id", middleware.checkOwner, function(req, res) {
  geocoder.geocode(req.body.location, function(err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground) {
      if (err) {
        res.redirect("/campgrounds");
      } else {
        res.redirect("/campgrounds/" + req.params.id);
      }
    });
  });
});

//Destroy Campground
router.delete("/:id", middleware.checkOwner, function(req, res) {
  Campground.findByIdAndRemove(req.params.id, function(err) {
    if (err) {
      res.redirect("/campgrounds")
    } else {
      res.redirect("/campgrounds")
    }
  })
})

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;
