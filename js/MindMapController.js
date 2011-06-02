mindmaps.MindMapController = function(eventBus, commandRegistry) {
	var self = this;
	this.document = null;
	this.selectedNode = null;

	var undoController = new mindmaps.UndoController(eventBus, commandRegistry);

	this.getDocument = function() {
		return this.document;
	};

	this.setDocument = function(doc) {
		this.document = doc;
		if (doc) {
			eventBus.publish(mindmaps.Event.DOCUMENT_OPENED, doc);
		} else {
			eventBus.publish(mindmaps.Event.DOCUMENT_CLOSED);
		}
	};

	this.getMindMap = function() {
		if (this.document) {
			return this.document.mindmap;
		}
		return null;
	};

	this.init = function() {
		var createCommand = commandRegistry.get(mindmaps.CreateNodeCommand);
		createCommand.setHandler(this.createNode);

		var deleteCommand = commandRegistry.get(mindmaps.DeleteNodeCommand);
		deleteCommand.setHandler(this.deleteNode);
	};

	this.deleteNode = function(node) {
		if (!node) {
			node = self.selectedNode;
		}
		var map = self.getMindMap();
		var action = new mindmaps.action.DeleteNodeAction(node, map);
		self.executeAction(action);
	};

	this.createNode = function(node, parent) {
		var map = self.getMindMap();
		if (!(node && parent)) {
			parent = self.selectedNode;
			var action = new mindmaps.action.CreateAutoPositionedNodeAction(
					parent, map);
		} else {
			var action = new mindmaps.action.CreateNodeAction(node, parent, map);
		}

		self.executeAction(action);
	};

	this.selectNode = function(node) {
		this.selectedNode = node;
		eventBus.publish(mindmaps.Event.NODE_SELECTED, node);
	};

	this.executeAction = function(action) {
		var executed = action.execute();

		// cancel action if false was returned
		if (executed !== undefined && !executed) {
			return false;
		}

		// publish event
		if (action.event) {
			if (!_.isArray(action.event)) {
				action.event = [ action.event ];
			}
			eventBus.publish.apply(eventBus, action.event);
		}

		// register undo function if available
		if (action.undo) {
			var undoFunc = function() {
				self.executeAction(action.undo());
			};

			// register redo function
			var redoFunc = null;
			if (action.redo) {
				redoFunc = function() {
					self.executeAction(action.redo());
				};
			}
			// eventBus.publish(mindmaps.Event.UNDO_ACTION, undoFunc, redoFunc);
			undoController.addUndo(undoFunc, redoFunc);
		}
	};

	this.init();
};