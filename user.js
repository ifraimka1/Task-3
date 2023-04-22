const express = require('express');
const router = express.Router();

router.get('/:userId', 
   (req, res) => {
    res.render('home', {
        userId: req.params.userId
    });
})

module.exports = router;