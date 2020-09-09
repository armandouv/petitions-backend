import { Injectable } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { PetitionQueryParams } from './dto/petition-query-params.dto';
import { Page } from 'src/types/Page';
import { PetitionInfo } from 'src/types/ElementInfo';
import { PetitionRepository } from './petitions.repository';
import { Petition } from 'src/entities/petition.entity';

@Injectable()
export class PetitionsService
{
    constructor(private petitionRepository: PetitionRepository) {}

    async getPetitionsPageBySchool(params: PetitionQueryParams, user: User): Promise<Page<PetitionInfo>>
    {
        const { pageElements: petitions, totalPages } = await this.petitionRepository.getPetitionsPage(params);
        let petitionInfoArr: PetitionInfo[] = [];

        if (user)
        {
            petitionInfoArr = await this.mapPetitionsToAuthPetitionsInfo(petitions, user);
        }
        else
        {
            petitionInfoArr = await this.mapPetitionsToPetitionsInfo(petitions);
        }

        return {
            pageElements: petitionInfoArr,
            totalPages
        };
    }

    async mapPetitionsToPetitionsInfo(petitions: Petition[]): Promise<PetitionInfo[]>
    {
        const petitionInfoArr: PetitionInfo[] = [];

        for (const petition of petitions)
        {
            const numVotes = await this.petitionRepository.countNumberOfVotes(petition.id);
            const numComments = await this.petitionRepository.countNumberOfComments(petition.id);

            petitionInfoArr.push({
                id: petition.id,
                title: petition.title,
                date: petition.createdDate,
                status: petition.status,
                numVotes: numVotes,
                numComments: numComments
            });
        }

        return petitionInfoArr;
    }

    async mapPetitionsToAuthPetitionsInfo(petitions: Petition[], user: User): Promise<PetitionInfo[]>
    {
        const petitionInfoArr = await this.mapPetitionsToPetitionsInfo(petitions);

        for (const info of petitionInfoArr)
        {
            info.didVote = await this.petitionRepository.didUserVote(info.id, user.id);
            info.didSave = await this.petitionRepository.didUserSave(info.id, user.id);
        }

        return petitionInfoArr;
    }
}
