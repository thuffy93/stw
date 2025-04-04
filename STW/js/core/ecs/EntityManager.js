// Entity Component System - Core Entity Manager
import { EventBus } from '../../core/eventbus.js';
import { Utils } from '../../core/utils.js';

/**
 * EntityManager - Manages entities and their components
 */
export const EntityManager = (() => {
    // Maps to store entities and their components
    const entities = new Map();
    const entityTags = new Map();
    const componentsByType = new Map();
    
    // Counter for generating unique entity IDs
    let nextEntityId = 1;
    
    /**
     * Create a new entity
     * @param {Array} tags - Optional tags to categorize this entity
     * @returns {String} New entity ID
     */
    function createEntity(tags = []) {
        const entityId = `entity_${nextEntityId++}`;
        
        // Initialize entity in our maps
        entities.set(entityId, new Map());
        
        // Add tags if provided
        if (tags.length > 0) {
            entityTags.set(entityId, new Set(tags));
            
            // Register entity in each tag's collection
            tags.forEach(tag => {
                if (!componentsByType.has(`tag:${tag}`)) {
                    componentsByType.set(`tag:${tag}`, new Set());
                }
                componentsByType.get(`tag:${tag}`).add(entityId);
            });
        }
        
        // Notify systems of entity creation
        EventBus.emit('ENTITY_CREATED', { entityId, tags });
        
        return entityId;
    }
    
    /**
     * Add a component to an entity
     * @param {String} entityId - Entity ID
     * @param {String} componentType - Component type name
     * @param {Object} componentData - Component data
     * @returns {Boolean} Success status
     */
    function addComponent(entityId, componentType, componentData) {
        // Validate entity exists
        if (!entities.has(entityId)) {
            console.warn(`Cannot add component to non-existent entity: ${entityId}`);
            return false;
        }
        
        // Add the component to the entity
        entities.get(entityId).set(componentType, componentData);
        
        // Register this entity in the component type index
        if (!componentsByType.has(componentType)) {
            componentsByType.set(componentType, new Set());
        }
        componentsByType.get(componentType).add(entityId);
        
        // Notify systems of component addition
        EventBus.emit('COMPONENT_ADDED', { 
            entityId, 
            componentType,
            component: componentData
        });
        
        return true;
    }
    
    /**
     * Get a component from an entity
     * @param {String} entityId - Entity ID
     * @param {String} componentType - Component type name
     * @returns {Object|null} Component data or null if not found
     */
    function getComponent(entityId, componentType) {
        if (!entities.has(entityId)) {
            return null;
        }
        
        return entities.get(entityId).get(componentType) || null;
    }
    
    /**
     * Check if an entity has a component
     * @param {String} entityId - Entity ID
     * @param {String} componentType - Component type name
     * @returns {Boolean} Whether entity has the component
     */
    function hasComponent(entityId, componentType) {
        if (!entities.has(entityId)) {
            return false;
        }
        
        return entities.get(entityId).has(componentType);
    }
    
    /**
     * Remove a component from an entity
     * @param {String} entityId - Entity ID
     * @param {String} componentType - Component type name
     * @returns {Boolean} Success status
     */
    function removeComponent(entityId, componentType) {
        if (!entities.has(entityId) || !entities.get(entityId).has(componentType)) {
            return false;
        }
        
        // Remove component from entity
        entities.get(entityId).delete(componentType);
        
        // Remove entity from component type index
        if (componentsByType.has(componentType)) {
            componentsByType.get(componentType).delete(entityId);
        }
        
        // Notify systems of component removal
        EventBus.emit('COMPONENT_REMOVED', { 
            entityId, 
            componentType
        });
        
        return true;
    }
    
    /**
     * Remove an entity and all its components
     * @param {String} entityId - Entity ID
     * @returns {Boolean} Success status
     */
    function removeEntity(entityId) {
        if (!entities.has(entityId)) {
            return false;
        }
        
        // Get all component types this entity has
        const componentTypes = Array.from(entities.get(entityId).keys());
        
        // Remove entity from all component type indices
        componentTypes.forEach(componentType => {
            if (componentsByType.has(componentType)) {
                componentsByType.get(componentType).delete(entityId);
            }
        });
        
        // Remove entity tags
        if (entityTags.has(entityId)) {
            const tags = Array.from(entityTags.get(entityId));
            tags.forEach(tag => {
                if (componentsByType.has(`tag:${tag}`)) {
                    componentsByType.get(`tag:${tag}`).delete(entityId);
                }
            });
            entityTags.delete(entityId);
        }
        
        // Remove the entity itself
        entities.delete(entityId);
        
        // Notify systems of entity removal
        EventBus.emit('ENTITY_REMOVED', { entityId });
        
        return true;
    }
    
    /**
     * Get all entities with a specific component type
     * @param {String} componentType - Component type name
     * @returns {Array} Array of entity IDs
     */
    function getEntitiesWithComponent(componentType) {
        if (!componentsByType.has(componentType)) {
            return [];
        }
        
        return Array.from(componentsByType.get(componentType));
    }
    
    /**
     * Get all entities with all of the specified component types
     * @param {Array} componentTypes - Array of component type names
     * @returns {Array} Array of entity IDs
     */
    function getEntitiesWithComponents(componentTypes) {
        if (!componentTypes || componentTypes.length === 0) {
            return [];
        }
        
        // Start with entities that have the first component type
        const firstType = componentTypes[0];
        if (!componentsByType.has(firstType)) {
            return [];
        }
        
        // Filter entities that have all other component types
        return Array.from(componentsByType.get(firstType)).filter(entityId => {
            return componentTypes.every(type => hasComponent(entityId, type));
        });
    }
    
    /**
     * Get all entities with the specified tag
     * @param {String} tag - Tag name
     * @returns {Array} Array of entity IDs
     */
    function getEntitiesWithTag(tag) {
        const tagKey = `tag:${tag}`;
        if (!componentsByType.has(tagKey)) {
            return [];
        }
        
        return Array.from(componentsByType.get(tagKey));
    }
    
    /**
     * Add a tag to an entity
     * @param {String} entityId - Entity ID
     * @param {String} tag - Tag to add
     * @returns {Boolean} Success status
     */
    function addTag(entityId, tag) {
        if (!entities.has(entityId)) {
            return false;
        }
        
        // Initialize tags set if it doesn't exist
        if (!entityTags.has(entityId)) {
            entityTags.set(entityId, new Set());
        }
        
        // Add tag to entity
        entityTags.get(entityId).add(tag);
        
        // Register entity in tag index
        const tagKey = `tag:${tag}`;
        if (!componentsByType.has(tagKey)) {
            componentsByType.set(tagKey, new Set());
        }
        componentsByType.get(tagKey).add(entityId);
        
        // Notify systems of tag addition
        EventBus.emit('ENTITY_TAG_ADDED', { entityId, tag });
        
        return true;
    }
    
    /**
     * Check if an entity has a specific tag
     * @param {String} entityId - Entity ID
     * @param {String} tag - Tag to check
     * @returns {Boolean} Whether entity has the tag
     */
    function hasTag(entityId, tag) {
        if (!entityTags.has(entityId)) {
            return false;
        }
        
        return entityTags.get(entityId).has(tag);
    }
    
    /**
     * Remove a tag from an entity
     * @param {String} entityId - Entity ID
     * @param {String} tag - Tag to remove
     * @returns {Boolean} Success status
     */
    function removeTag(entityId, tag) {
        if (!entityTags.has(entityId) || !entityTags.get(entityId).has(tag)) {
            return false;
        }
        
        // Remove tag from entity
        entityTags.get(entityId).delete(tag);
        
        // Remove entity from tag index
        const tagKey = `tag:${tag}`;
        if (componentsByType.has(tagKey)) {
            componentsByType.get(tagKey).delete(entityId);
        }
        
        // Notify systems of tag removal
        EventBus.emit('ENTITY_TAG_REMOVED', { entityId, tag });
        
        return true;
    }
    
    /**
     * Get all tags for an entity
     * @param {String} entityId - Entity ID
     * @returns {Array} Array of tags
     */
    function getTags(entityId) {
        if (!entityTags.has(entityId)) {
            return [];
        }
        
        return Array.from(entityTags.get(entityId));
    }
    
    /**
     * Update a component on an entity
     * @param {String} entityId - Entity ID
     * @param {String} componentType - Component type name
     * @param {Object} updateData - Data to update (merged with existing data)
     * @returns {Boolean} Success status
     */
    function updateComponent(entityId, componentType, updateData) {
        if (!entities.has(entityId) || !entities.get(entityId).has(componentType)) {
            return false;
        }
        
        // Get current component data
        const currentData = entities.get(entityId).get(componentType);
        
        // Merge update data with current data
        const updatedData = { ...currentData, ...updateData };
        
        // Set updated component
        entities.get(entityId).set(componentType, updatedData);
        
        // Notify systems of component update
        EventBus.emit('COMPONENT_UPDATED', { 
            entityId, 
            componentType,
            component: updatedData
        });
        
        return true;
    }
    
    /**
     * Get all components for an entity
     * @param {String} entityId - Entity ID
     * @returns {Object} Map of component types to component data
     */
    function getAllComponents(entityId) {
        if (!entities.has(entityId)) {
            return new Map();
        }
        
        return new Map(entities.get(entityId));
    }
    
    /**
     * Clear all entities and components
     */
    function clear() {
        entities.clear();
        entityTags.clear();
        componentsByType.clear();
        nextEntityId = 1;
        
        EventBus.emit('ECS_CLEARED');
    }
    
    /**
     * Serialize the entire ECS state
     * @returns {Object} Serialized ECS state
     */
    function serialize() {
        const serializedEntities = [];
        
        entities.forEach((components, entityId) => {
            const serializedComponents = {};
            components.forEach((componentData, componentType) => {
                serializedComponents[componentType] = componentData;
            });
            
            const entityTags = getTags(entityId);
            
            serializedEntities.push({
                id: entityId,
                components: serializedComponents,
                tags: entityTags
            });
        });
        
        return {
            entities: serializedEntities,
            nextId: nextEntityId
        };
    }
    
    /**
     * Deserialize ECS state
     * @param {Object} state - Serialized ECS state
     */
    function deserialize(state) {
        // Clear current state
        clear();
        
        // Restore next ID counter
        nextEntityId = state.nextId || 1;
        
        // Restore entities and components
        state.entities.forEach(entityData => {
            const entityId = entityData.id;
            const components = entityData.components;
            const tags = entityData.tags || [];
            
            // Create entity with predefined ID
            entities.set(entityId, new Map());
            
            // Add tags
            if (tags.length > 0) {
                entityTags.set(entityId, new Set(tags));
                tags.forEach(tag => {
                    const tagKey = `tag:${tag}`;
                    if (!componentsByType.has(tagKey)) {
                        componentsByType.set(tagKey, new Set());
                    }
                    componentsByType.get(tagKey).add(entityId);
                });
            }
            
            // Add components
            Object.entries(components).forEach(([componentType, componentData]) => {
                // Add component to entity
                entities.get(entityId).set(componentType, componentData);
                
                // Register in component type index
                if (!componentsByType.has(componentType)) {
                    componentsByType.set(componentType, new Set());
                }
                componentsByType.get(componentType).add(entityId);
            });
            
            // Notify of entity creation (with components already added)
            EventBus.emit('ENTITY_RESTORED', { 
                entityId, 
                components: Object.keys(components),
                tags
            });
        });
    }
    
    // Public API
    return {
        createEntity,
        removeEntity,
        addComponent,
        getComponent,
        hasComponent,
        removeComponent,
        updateComponent,
        getAllComponents,
        getEntitiesWithComponent,
        getEntitiesWithComponents,
        addTag,
        removeTag,
        hasTag,
        getTags,
        getEntitiesWithTag,
        clear,
        serialize,
        deserialize
    };
})();

export default EntityManager;