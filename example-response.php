<?php

    /**
     * Returns some stuff
     * @return mixed
     */
    function uniqueSHAccommodations() {

        $someStuff = ['SomeObjectsFromDB'];

        return json_encode(array(
            'contentLoaderTitleSection' => 'My Main Section in Home Page h2',
            'contentLoaderSubtitleSection' => 'A paragraph with some text description',
            'contentLoaderHTML' => $someStuff,
            'contentLoaderLink' => '',
            'trackingSection' => 'Home Page',
            'trackingAction' => 'Clicked My Link Stuff',
            'errors' => ''
        ), 200);
    }
