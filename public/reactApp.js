var socket = io('http://localhost:3000');

var Panel = React.createClass({
  getInitialState: function() {
    return {type: 'artist', list : [], api: "/api/artists", buttonIsClickable: false };
  },


  getLibrary: function(type, api){
    console.log(type + ' ' + api)
    $.ajax({
      url: api,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({ list: data, type: type });
      }.bind(this),
      error: function(xhr, status, err) {
        console.error('Api Failure');
      }.bind(this)
    });
  },

  componentDidMount: function(){
    this.getLibrary(this.state.type, this.state.api);        
  },

  handleBack: function(btn){

    if(this.state.type == 'song'){
      this.getLibrary('album', '/api/artist/' + this.state.artistState);
    } else{
      this.getLibrary('artist', this.state.api);
    }
  },


  handleClick: function (chain) {
    var updatedState, api;
    var artistState = null;

    switch(chain.dataType){
      case 'artist' :
        updatedState = 'album';
        api = '/api/artist/' + chain.name;
        this.setState({artistState: chain.name, buttonIsClickable: true});
      break;

      case 'album' : 
      //  Switch state to song
        updatedState = 'song';
        api = '/api/artist/' + this.state.artistState + '/album/' + chain.name;
        this.setState({albumState: chain.name, buttonIsClickable: true });
      break

      case 'song' : 
        updatedState = 'endofline';
      break;
    }

    if(updatedState == 'endofline'){
      console.log('We need to play the song now')
    } else{
      this.getLibrary(updatedState, api);
    }
    
  },

  render: function() {
    return (
      <div class="library-panel">
        <div className="panel panel-info">
          <div className="panel-heading">
              <h3 className="panel-title">My Title</h3>
          </div>
          <div className="panel-body">
            <Librarylist onClick={ this.handleClick } data = {this.state.list} type={this.state.type} />
          </div>
        </div>

        <BackButton isClickable = {this.state.buttonIsClickable} onClick={ this.handleBack } />
      </div>
    );
  }
});


//  Library Item List Componenet
var Librarylist = React.createClass({

  handleClick: function( item ) {
    this.props.onClick(item);
  },

  render: function() {
    var type = this.props.type;

    return (
      <div className="list-group">
        {this.props.data.map( function(item, i){

          if( typeof item === 'object' ){
            return (
              <LibraryItem name= {item.title} location = {item.location} sid={item._id} dataType = 'song' onClick={this.handleClick} />
            );
          } else{
            return (
              <LibraryItem name= {item} dataType = {type} onClick={this.handleClick} />
            );
          }
          
        }, this)}
      </div>
    );
  }
});

//  Individual Item Element
var LibraryItem = React.createClass({

  handleClick: function(){
    console.log(this.props);
    this.props.onClick(this.props);

  },

  render: function(){
    return (
      <a className="list-group-item" onClick={ this.handleClick }>
        {this.props.name}
      </a>
    )
  }

});

//  Back Button Componenet
var BackButton = React.createClass({

  handleClick: function(){
    this.props.onClick();
  },

  render: function(){
    var classString = "btn btn-primary btn-large";
    if(this.props.isClickable == false){
      classString += ' disabled';
    }
    return(
      <button className={classString} onClick={ this.handleClick }><i className="icon-white icon-arrow-left"></i> Go Back</button>
    )
  }
});

/*  Everything for the chat */

var UserList = React.createClass({
  render: function(){
    var users = function(user){
      return <li> { user } </li>
    };

    return(
      <div className="users">
        <h3> Online Users </h3>
        <ul> { this.props.users.map( users ) } </ul>
      </div>
    )
  }
});

var Message = React.createClass({

  render: function(){
    return(
      <div class="message">
        <strong> { this.props.user } </strong> : 
        { this.props.text }
      </div>
    )
  }
});

var MessageList = React.createClass({

  render: function(){
    var showMessage = function(m){
      return <Message user = { m.user } text = { m.text } />
    }

    return(
      <div class="messages">
        <h2> Conversation : </h2>
        { this.props.messages.map(showMessage) }
      <div>
    )
  }

});



/********************************************************/

React.render(
<Panel />,
  document.getElementById('content')
);