import Building from "#models/building";
import Campus from "#models/campus";
import { HttpContext } from "@adonisjs/core/http";
export default class BuildingsController {

    async getAll({ response }: HttpContext) {
        try {
            const buildings = await Building.all();
            if(buildings.length === 0) {
                return response.status(404).json( {message: "No buildings in database"} )   
            } 
            return response.status(200).json(buildings.map(
                (building) => building.serialize()
            ));
        } catch (error) {
            return response.status(500).json({ message: 'Failed to fetch buildings', error: error.message });
        }
    }

    async getById({ request, response}: HttpContext) {
        try {
            const id = request.param('id')
            if(!id) {
                return response.status(400).json({ message: 'Building ID is required' });
            } 
            const building = await Building.find(id)
            if(building) {
                return response.status(200).json(building.serialize())
            }
            return response.status(404).json({ message: `No building with id: ${id}` })
        } catch (error) {
            return response.status(500).json({ message: 'Failed to fetch building by id', error: error.message });
        }
    }

    async getByCampus({ request, response }: HttpContext) {
        try {
            const campusId = request.param('id')
            if(!campusId) return response.status(400).json({ message: 'campus ID is required' });
             
            const [campus, buildings] = await Promise.all([
                Campus.find(campusId),
                Building.query().where('campusId', campusId)
            ]);    

            if (!campus) return response.status(404).json({ message: 'Campus not found' });
            if (!buildings.length) return response.status(404).json({ message: 'No buildings with given campus id' });

            return response.status(200).json({
                campus: campus.serialize(),
                buildings: buildings.map(building => building.serialize())
            });
        } catch (error) {
            return response.status(500).json({ 
                message: 'Failed to fetch buildings by campus', 
                error: error.message 
            });
        }
    }

    async getCampuses({ response }: HttpContext) {
        try {
            const campuses = await Campus.all()
            if(!campuses.length) return response.status(404).json({ message: 'No campus in database' });
            return response.status(200).json(
                campuses.map(campus => campus.serialize()
            ));
        } catch (error) {
            return response.status(500).json({ message: 'Failed to fetch campuses'})
        }
    }

    async getCampusById({ request, response }: HttpContext) {
        try {
            const id = request.param('id');
            if(!id) return response.status(400).json({ message: 'campus ID is required' });
            
            const campus = await Campus.find(id);
            await campus?.load('buildings');
            if(!campus) return response.status(404).json({ message: 'Campus not found' });
            
            return response.status(200).json(campus.serialize());
        } catch (error) {
            return response.status(500).json({ message: 'Failed to fetch campus by Id'})
        }
    }
}