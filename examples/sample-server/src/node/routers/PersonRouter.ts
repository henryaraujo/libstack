import { GET, POST, PUT, DELETE, RestController } from '@libstack/server';
import { Request } from 'express';

import { PersonResponse } from '../models/PersonModel';
import personService from '../services/PersonService';

@RestController('/v1/person')
class PersonRouter {

  @GET('/')
  async listPerson({ query }:Request):Promise<PersonResponse[]> {
    return personService.list(query);
  }

  @GET('/:id')
  async findPerson({ params:{id} }:Request):Promise<PersonResponse> {
    return personService.get(id);
  }

  @POST('/')
  async createPerson(req:Request):Promise<PersonResponse> {
    const { body } = req
    return personService.create(body);
  }

  @PUT('/:id')
  async updatePerson(req:Request):Promise<PersonResponse> {
    const {params:{id}, body} = req;
    return personService.update(id, body);
  }

  @DELETE('/:id')
  async deletePerson({ params:{id} }:Request):Promise<void> {
    await personService.deletePerson(id);
  }

}
