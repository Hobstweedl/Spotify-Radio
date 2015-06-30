module.exports = {

  authenticate: function (arr, username, password) {

  	var l = arr.length;
	for(var i = 0; i < l; i++){
		if( arr[i].name == username){
			
			if( arr[i].password == password){
				return arr[i].name;
			}
		}
	}
	return false;
  },

  getSeekAverage: function (avgs) {
    
    var sum = 0
    var l = avgs.length;
    for( var j = 0; j < l; j++){
        sum += avgs[j];
    }
    var avg = sum/l;

    return avg;

  },

  findUser: function (arr, username) {
    
    var found = false;

    for( var i in arr){
        if(arr[i].name == username){
          found = true;
        }
    }
    return found;

  },

  finderFunction: function(arr, socket, seat){
    for( var i in arr){
        if(arr[i].id == socket){
          return arr[i].seat = seat;
        }
    }
  },

  removeSeat: function(arr, username){
    for( var i in arr){
        if(arr[i].name == username){
          arr[i] = {};
        }
    }
    
    return arr;
  },

  checkForSession: function (session, arr) {
    
    for( var i = 0; i < arr.length; i++){
		if(arr[i].session == session){
			return arr[i].session
		}
	}

	return false;
	
  }

};
//tom sawyer distant early warning wreckers closer to the heart subdivisions