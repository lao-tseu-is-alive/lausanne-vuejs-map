#!/bin/bash
SVN_DIST_FOLDER=/data/prod_from_svn/trunk/linux/golux/dataweb/GoelandWeb/gdtlib/js/vuecomponent/lausanneVuejsMap/
svn del $SVN_DIST_FOLDER/*
cp dist/* $SVN_DIST_FOLDER
svn add $SVN_DIST_FOLDER/*
